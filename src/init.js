// Initialize Twilio
const Twilio = require('twilio')
const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

// Initialize NaCl Crypto lib
const initNaCl = async () => {
  return new Promise((resolve, reject) => {
    require('js-nacl').instantiate(async (nacl) => {
      resolve(nacl)
    })
  })
}

module.exports = async () => {
  const nacl = await initNaCl()
  const { sid } = await client.verify.services.create({
    friendlyName: process.env.APP_NAME || "twilio-auth testing"
  })

  const verificationService = await client.verify.services(sid)
  return  { client, nacl, verificationService }
}

