const sinon = require('sinon')
const chai = require('chai')
chai.use(require('dirty-chai'))
chai.use(require('chai-datetime'))
const expect = chai.expect

const envoose = require('..')

beforeEach(sinon.restore)

describe('envoose', async () => {
  describe('basic parsing', async () => {
    it('should read config value from process.env', async () => {
      sinon.stub(process, 'env').value({ KEY: 'val' })
      const configSchema = { KEY: {} }
      const config = envoose.getConfig(configSchema)
      expect(config.KEY).to.equal('val')
    })
  })

  describe('default value', async () => {
    it('should fallback to default value if env var is not set', async () => {
      sinon.stub(process, 'env').value({})
      const configSchema = { KEY: { default: 'default' } }
      const config = envoose.getConfig(configSchema)
      expect(config.KEY).to.equal('default')
    })

    it('should use env var if supplied with default value', async () => {
      sinon.stub(process, 'env').value({ KEY: 'val' })
      const configSchema = { KEY: { default: 'default' } }
      const config = envoose.getConfig(configSchema)
      expect(config.KEY).to.equal('val')
    })
  })

  describe('env key', async () => {
    it('should read from custom env var', async () => {
      sinon.stub(process, 'env').value({ KEY: 'val', CUSTOM_KEY: 'custom_val' })
      const configSchema = { KEY: { env: 'CUSTOM_KEY' } }
      const config = envoose.getConfig(configSchema)
      expect(config.KEY).to.equal('custom_val')
    })
  })

  describe('required validator', async () => {
    it('should not fail if required value is supplied', async () => {
      sinon.stub(process, 'env').value({ REQUIRED: 'required' })
      const configSchema = { REQUIRED: { required: true } }
      const config = envoose.getConfig(configSchema)
      expect(config.REQUIRED).to.equal('required')
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

    describe('type casting', async () => {
      it('should cast to Number', async () => {
        sinon.stub(process, 'env').value({ KEY: '505' })
        const configSchema = { KEY: { type: Number } }
        const config = envoose.getConfig(configSchema)
        expect(config.KEY).to.equal(505)
      })

      it('should cast to Date', async () => {
        sinon.stub(process, 'env').value({ KEY: '2014-03-03T10:10:10.000Z' })
        const configSchema = { KEY: { type: Date } }
        const config = envoose.getConfig(configSchema)
        expect(config.KEY).to.equalDate(new Date('2014-03-03T10:10:10.000Z'))
      })

      it('should cast true boolean vals', async () => {
        sinon.stub(process, 'env').value({
          B_1: '1',
          B_TRUE: 'true',
          B_YES: 'yes'
        })
        const configSchema = {
          B_1: { type: Boolean },
          B_TRUE: { type: Boolean },
          B_YES: { type: Boolean }
        }
        const config = envoose.getConfig(configSchema)
        expect(config.B_1).to.be.true()
        expect(config.B_TRUE).to.be.true()
        expect(config.B_YES).to.be.true()
      })

      it('should cast false boolean vals', async () => {
        sinon.stub(process, 'env').value({
          B_0: '0',
          B_FALSE: 'false',
          B_NO: 'no'
        })
        const configSchema = {
          B_0: { type: Boolean },
          B_FALSE: { type: Boolean },
          B_NO: { type: Boolean }
        }
        const config = envoose.getConfig(configSchema)
        expect(config.B_0).to.be.false()
        expect(config.B_FALSE).to.be.false()
        expect(config.B_NO).to.be.false()
      })

      it('should throw CastError if invalid Boolean val', async () => {
        sinon.stub(process, 'env').value({ B: 'okay' })
        const configSchema = { B: { type: Boolean } }
        expect(() => envoose.getConfig(configSchema)).to.throw(envoose.error.CastError)
      })

      it('should cast custom types', async () => {
        sinon.stub(process, 'env').value({ KEY: '1,2,3' })
        const configSchema = { KEY: { type: s => s.split(',').map(Number) } }
        const config = envoose.getConfig(configSchema)
        expect(config.KEY).to.be.an('array')
        expect(config.KEY).to.eql([1, 2, 3])
      })
    })

    describe('enum validator', async () => {
      it('should throw ConfigScheemaValidationError if enum is not array', async () => {
        sinon.stub(process, 'env').value({ KEY: 'A' })
        const configSchema = { KEY: { enum: 'A' } }
        expect(() => envoose.getConfig(configSchema)).to.throw(envoose.error.ConfigSchemaValidationError)
      })

      it('should succeed if value is in enum', async () => {
        sinon.stub(process, 'env').value({ KEY: 'B' })
        const configSchema = { KEY: { enum: ['A', 'B', 'C'] } }
        envoose.getConfig(configSchema)
      })

      it('should throw ConfigValidationError if value is not in enum', async () => {
        sinon.stub(process, 'env').value({ KEY: 'Z' })
        const configSchema = { KEY: { enum: ['A', 'B', 'C'] } }
        expect(() => envoose.getConfig(configSchema)).to.throw(envoose.error.ConfigValidationError)
      })
    })

    describe('match validator', async () => {
      it('should throw ConfigScheemaValidationError if match is not regex', async () => {
        sinon.stub(process, 'env').value({ KEY: 'A' })
        const configSchema = { KEY: { match: 'A' } }
        expect(() => envoose.getConfig(configSchema)).to.throw(envoose.error.ConfigSchemaValidationError)
      })

      it('should succeed if value matches', async () => {
        sinon.stub(process, 'env').value({ KEY: 'Hello World' })
        const configSchema = { KEY: { match: /Hello.*/g } }
        envoose.getConfig(configSchema)
      })

      it('should throw ConfigValidationError if value doesn\'t match', async () => {
        sinon.stub(process, 'env').value({ KEY: 'Goodbye World' })
        const configSchema = { KEY: { match: /Hello.*/g } }
        expect(() => envoose.getConfig(configSchema)).to.throw(envoose.error.ConfigValidationError)
      })
    })

    describe('custom validator', async () => {
      it('should throw ConfigScheemaValidationError if validator is not function', async () => {
        sinon.stub(process, 'env').value({ KEY: 'A' })
        const configSchema = { KEY: { validator: 'A' } }
        expect(() => envoose.getConfig(configSchema)).to.throw(envoose.error.ConfigSchemaValidationError)
      })

      it('should succeed if value matches', async () => {
        sinon.stub(process, 'env').value({ KEY: '11' })
        const configSchema = { KEY: { type: Number, validator: x => x > 10 } }
        envoose.getConfig(configSchema)
      })

      it('should throw ConfigValidationError if value doesn\'t match', async () => {
        sinon.stub(process, 'env').value({ KEY: '9' })
        const configSchema = { KEY: { type: Number, validator: x => x > 10 } }
        expect(() => envoose.getConfig(configSchema)).to.throw(envoose.error.ConfigValidationError)
      })
    })
  })
})
