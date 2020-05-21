require('dotenv').config()
const { SALT, HTTP_HOST, HTTP_PORT } = process.env

const cors = require('cors')
const CryptoJS = require('crypto-js')
const express = require('express')
const TallyLabIdentities = require('tallylab-orbitdb-identity-provider')

;(async () => {
  const { nacl, verifications, verificationChecks } = await require('./init')()

  async function verify (req, res, next) {
    try {
      const to = req.body.to
      const channel = !!req.body.channel || 'sms'
      const { sid, status } = await verifications.create({ to, channel })
      res.json({ sid, status })
    } catch (err) { next(err) }
  }

  async function checkVerification (req, res, next) {
    try {
      const { to, code } = req.body
      const { valid } = await verificationChecks.create({ to, code })
      if (!valid) return res.status(403).end('Verification Failed')
      next()
    } catch (err) { next(err) }
  }

  async function generateKeys (req, res, next) {
    try {
      const { to } = req.body
      const idProvider = new TallyLabIdentities().TallyLabIdentityProvider
      const hash = CryptoJS.SHA256(to + SALT)
      const buffer = Buffer.from(hash.toString(CryptoJS.enc.Hex), 'hex')
      const tlKeys = idProvider.keygen(nacl, buffer)
      res.json(tlKeys.stringCompatible)
    } catch (e) { next(e) }
  }

  const app = express()
  app.use(cors())
  app.use(require('body-parser').json())
  app.use(express.static('examples'))
  app.post('/verify', verify)
  app.post('/login', checkVerification, generateKeys)
  app.listen(HTTP_PORT, HTTP_HOST, () => {})
})()
