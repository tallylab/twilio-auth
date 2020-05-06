require('dotenv').config()
const { SALT, HTTP_HOST, HTTP_PORT } = process.env

const CryptoJS = require('crypto-js')
const express = require('express')
const TallyLabIdentities = require('tallylab-orbitdb-identity-provider')

const start = async () => {
  const app = express()
  app.use(require('body-parser').json())
  app.use(express.static('examples'))

  const { nacl, verifications, verificationChecks } = await require('./init')()

  app.post('/verify', async function (req, res, next) {
    try {
      const { to } = req.body
      const { sid, status } = await verifications.create({ to, channel: 'sms' })
      res.json({ sid, status })
    } catch (err) { next(err) }
  })

  app.post('/login', async function (req, res, next) {
    try {
      const { to, code } = req.body
      const { status } = await verificationChecks.create({ to, code })
      if (status === 'denied') return res.status(403).end('Verification Failed')
      next()
    } catch (err) { next(err) }
  }, async function (req, res, next) {
    const toNumber = req.body.phoneNumber
    try {
      const idProvider = new TallyLabIdentities().TallyLabIdentityProvider
      const hash = CryptoJS.SHA256(toNumber + SALT)
      const buffer = Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex')
      const tlKeys = idProvider.keygen(nacl, buffer)
      res.json(tlKeys)
    } catch (e) { next(e) }
  })

  app.listen(HTTP_PORT, HTTP_HOST, () => {})
}

module.exports = { start }
