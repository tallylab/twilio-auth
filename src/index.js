require('dotenv').config()
const { SALT, TWILIO_FROM_NUMBER } = process.env
const HTTP_HOST = process.env.HTTP_HOST || '127.0.0.1'
const HTTP_PORT = process.env.HTTP_PORT || 3000

const CryptoJS = require('crypto-js')
const TallyLabIdentities = require('tallylab-orbitdb-identity-provider')

// TODO: Doc
const express = require('express')
const start = async() => {
  const app = express()
  app.use(require('body-parser').json())
  app.use(express.static('examples'))

  const { client, nacl, verificationService } = await require('./init')()

  app.post('/verify', async function(req, res) {
    try {
      const numberToVerify = req.body.phoneNumber
      const { sid, status } = verificationService.verifications
        .create({to: numberToVerify, channel: 'sms'})
      res.json({ sid, status })
    } catch (e) {
      // TODO: Proper error handling
      console.error(e)
      res.status(500).end('There was an error')
    }
  })

  app.post('/login', async function (req, res, next) {
    const toNumber = req.body.phoneNumber
    const verificationCode = req.body.verificationCode

    try {
      const verification = await verificationService.verificationChecks
        .create({ to: toNumber, code: verificationCode })
      if (verification.valid === false) return res.status(500).end("error")
      next()
    } catch (e) {
      // TODO: Proper error handling
      console.error(e)
      res.status(500).end('There was an error')
    }
  }, async function(req, res) {
    const toNumber = req.body.phoneNumber
    try {
      const idProvider = new TallyLabIdentities().TallyLabIdentityProvider

      const hash = CryptoJS.SHA256(toNumber + SALT)
      let buffer = Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex')
      const tlKeys = idProvider.keygen(nacl, buffer)

      res.json(tlKeys)
    } catch (e) {
      // TODO: Proper error handling
      console.error(e)
      res.status(500).end('Error: SMS message not sent')
    }
  })

  app.listen(HTTP_PORT, HTTP_HOST, () => {});

  return { HTTP_HOST, HTTP_PORT }
}

module.exports = { start }
