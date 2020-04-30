const Keystore = require('orbit-db-keystore')
const TallyLabIdentities = require('tallylab-orbitdb-identity-provider')

const CID = require('cids')
const multihashing = require('multihashing-async')

// Load configuration from .env file
require('dotenv').config()
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env

// Download the helper library from https://www.twilio.com/docs/node/install
// Your Account Sid and Auth Token from twilio.com/console
// DANGER! This is insecure. See http://twil.io/secure
const Twilio = require('twilio')
const client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
const toNumber = process.argv[2]

require('js-nacl').instantiate(async (nacl) => {
  const tlIdentities = new TallyLabIdentities()

  const hash = await multihashing(Buffer.from('OMG!'), 'sha2-256')
  const cid = new CID(1, 'dag-pb', hash)
  console.log(cid.toString().substr(32))

  // Generate keys, either with or without a seed
  const seed = 'thisisexactlythirtytwocharacters'
  const tlKeys = tlIdentities.TallyLabIdentityProvider.keygen(nacl, seed)

  client.messages
   .create({
      body: tlKeys.toString(),
      from: TWILIO_FROM_NUMBER,
      to: `+${toNumber}`
    })
   .then(console.log)
   .catch(console.error)
})
