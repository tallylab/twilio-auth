// Load configuration from .env file
require('dotenv').config()
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env

// Initialize Twilio
const Twilio = require('twilio')
const client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

const TallyLabIdentities = require('tallylab-orbitdb-identity-provider')
const multihashing = require('multihashing-async')
const Ctl = require('ipfsd-ctl')

const controllerOptions = {
  ipfsHttpModule: require('ipfs-http-client'),
  ipfsBin: require('go-ipfs-dep').path(),
  config: {
  }
}

const initIPFS = async () => {
  const ipfsd = await Ctl.createController(controllerOptions);
  return ipfsd.api
}

const initNaCl = async () => {
  return new Promise((resolve, reject) => {
    require('js-nacl').instantiate(async (nacl) => {
      resolve(nacl)
    })
  })
}

// First, instantiate the js-nacl cryptography library
const start = async() => {
  const HTTP_HOST = process.env.HTTP_HOST || '127.0.0.1'
  const HTTP_PORT = process.env.HTTP_PORT || 3000

  const ipfs = await initIPFS()
  const nacl = await initNaCl()

  console.log('initializing app')

  const app = require('express')()
  app.use(require('body-parser').json())

  app.post('/login', async function (req, res) {
    const toNumber = req.body.phoneNumber
    const tlIdentities = new TallyLabIdentities()

    // Hash the phone number + salt to 32 bytes
    const hash = await multihashing(Buffer.from(toNumber + process.env.SALT), 'sha2-256')
    // console.log(hash.length, hash.toString().length)
    const tlKeys = tlIdentities.TallyLabIdentityProvider.keygen(nacl, hash.toString())
    const cid = await ipfs.dag.put(tlKeys)

    client.messages
      .create({
        body: `https://ipfs.io/ipfs/${cid.toString()}`,
        from: TWILIO_FROM_NUMBER,
        to: `+${toNumber}`
      })
      .then(res.end(cid.toString()))
      .catch(res.status(500).end('Error: SMS message not sent'))
  })

  app.listen(HTTP_PORT, HTTP_HOST, () => {});

  return { HTTP_HOST, HTTP_PORT }
}

module.exports = { start }
