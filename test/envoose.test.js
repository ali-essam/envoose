const sinon = require('sinon')
const chai = require('chai')
chai.use(require('dirty-chai'))
const expect = chai.expect

const envoose = require('..')

beforeEach(sinon.restore)

describe('envoose', async () => {
  describe('basic parsing', async () => {
    it('should read config value from process.env', async () => {
      sinon.stub(process, 'env').value({ KEY: 'val' })
      const configSchema = { KEY: {} }
      const config = envoose.getConfig(configSchema)
      expect(config.KEY).to.eql('val')
    })
  })

  describe('default value', async () => {
    it('should fallback to default value if env var is not set', async () => {
      sinon.stub(process, 'env').value({})
      const configSchema = { KEY: { default: 'default' } }
      const config = envoose.getConfig(configSchema)
      expect(config.KEY).to.eql('default')
    })

    it('should use env var if supplied with default value', async () => {
      sinon.stub(process, 'env').value({ KEY: 'val' })
      const configSchema = { KEY: { default: 'default' } }
      const config = envoose.getConfig(configSchema)
      expect(config.KEY).to.eql('val')
    })
  })

  describe('required validator', async () => {
    it('should not fail if required value is supplied', async () => {
      sinon.stub(process, 'env').value({ REQUIRED: 'required' })
      const configSchema = { REQUIRED: { required: true } }
      const config = envoose.getConfig(configSchema)
      expect(config.REQUIRED).to.eql('required')
    })

    it('should not fail if non-required value is not supplied', async () => {
      sinon.stub(process, 'env').value({})
      const configSchema = { NOT_REQUIRED: {} }
      const config = envoose.getConfig(configSchema)
      expect(config.NOT_REQUIRED).to.be.undefined()
    })

    it('should throw ConfigValidationError if required value is not supplied', async () => {
      sinon.stub(process, 'env').value({})
      const configSchema = { REQUIRED: { required: true } }
      expect(() => envoose.getConfig(configSchema)).to.throw(envoose.error.ConfigValidationError)
    })

    it('should throw ConfigSchemaValidationError if required and default are set', async () => {
      const configSchema = { REQUIRED: { required: true, default: 'default' } }
      expect(() => envoose.getConfig(configSchema)).to.throw(envoose.error.ConfigSchemaValidationError)
    })
  })
})
