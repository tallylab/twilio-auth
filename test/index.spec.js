const assert = require('assert')
const fetch = require('node-fetch')

const { start } = require('../src')

describe('Workflow', function () {
  this.timeout(10000)
  let BASE_URL

  before(async () => {
    const { HTTP_HOST, HTTP_PORT } = await start()
    const HTTP_PROTOCOL = process.env.HTTP_PROTOCOL || 'http'
    BASE_URL = `${HTTP_PROTOCOL}://${HTTP_HOST}:${HTTP_PORT}`
  })

  it('does a thing', async () => {
    process.env.SALT = 'xxxx'

    const res = await fetch(`${BASE_URL}/login`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        phoneNumber: "+19991234567"
      })
    })

    const expectedHash = 'bafyreih7yudmayenqv5oqaz33pvqvmx7x3h2o3wms4km45q27spu2kiij4'
    assert.strictEqual(await res.text(), expectedHash)
  })

  it('errors on an invalid phone number', async () => {
  })
})
