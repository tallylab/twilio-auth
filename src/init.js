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

// Export async initialization function
module.exports = async () => {
  const nacl = await initNaCl()

  const sid = process.env.TWILIO_VERIFY_SID || (await client.verify.services.create({
    friendlyName: process.env.APP_NAME || 'twilio-auth testing'
  })).sid

  console.log(sid)

  const { verifications, verificationChecks } = await client.verify.services(sid)
  return { client, nacl, verifications, verificationChecks }
}
