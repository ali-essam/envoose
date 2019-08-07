class ConfigSchemaValidationError extends Error {
  constructor (messages) {
    const message = messages.map(s => `- ${s}`).join('\n')
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.constructor.prototype.name = this.constructor.name
  }
}

class ConfigValidationError extends Error {
  constructor (messages) {
    const message = messages.map(s => `- ${s}`).join('\n')
    super(message)
    Error.captureStackTrace(this, this.constructor)
    this.constructor.prototype.name = this.constructor.name
  }
}

class CastError extends Error {
  constructor (varName, err) {
    super(err.message)
    this.stack = `${this.constructor.name}[${varName}]: ${err.stack}`
    this.constructor.prototype.name = this.constructor.name
  }
}

/**
 * Check if value is null or undefined
 * @param  {any}     x
 * @return {Boolean}
 */
const _isNil = x => x == null

/**
 * Validate configuration schema before evaluating values
 * @param  {object} configSchema configSchema to validate
 */
const _validateConfigSchema = (configSchema) => {
  const errors = []
  for (const [varName, varSchema] of Object.entries(configSchema)) {
    if (varSchema.required && varSchema.default !== undefined) {
      errors.push(`${varName} can't be required and have default value`)
    }
    if (varSchema.enum !== undefined && !Array.isArray(varSchema.enum)) {
      errors.push(`${varName} enum must be an array`)
    }
    if (varSchema.match !== undefined && !(varSchema.match instanceof RegExp)) {
      errors.push(`${varName} match must be regex`)
    }
    if (varSchema.validator !== undefined && typeof varSchema.validator !== 'function') {
      errors.push(`${varName} validator must be function`)
    }
  }
  if (errors.length > 0) {
    throw new ConfigSchemaValidationError(errors)
  }
}

/**
 * Validate config values
 * @param  {object} config       parsed config
 * @param  {object} configSchema corresponding configSchema
 */
const _validateConfig = (config, configSchema) => {
  const errors = []
  for (const [varName, varSchema] of Object.entries(configSchema)) {
    const env = varSchema.env || varName
    const val = config[varName]

    if (varSchema.required && val === undefined) {
      errors.push(`${varName} is required but env var [${env}] is not set`)
    }
    if (val !== undefined) {
      if (varSchema.enum !== undefined && !varSchema.enum.includes(val)) {
        errors.push(`${varName} invalid value '${val}', doesn't match enum [${varSchema.enum}]`)
      }
      if (varSchema.validator !== undefined && !varSchema.validator(val)) {
        errors.push(`${varName} invalid value '${val}', custom validator fails`)
      }
      if (varSchema.match !== undefined && !varSchema.match.test(val)) {
        errors.push(`${varName} invalid value '${val}', doesn't match regex [${varSchema.match}]`)
      }
    }
  }
  if (errors.length > 0) {
    throw new ConfigValidationError(errors)
  }
}

/**
 * Boolean wrapper that casts non-boolean objects to bool
 * @param  {Boolean|String|Number} x
 * @return {Boolean}
 */
const _Boolean = (x) => {
  if ([true, 'true', 1, '1', 'yes'].includes(x)) return true
  else if ([false, 'false', 0, '0', 'no'].includes(x)) return false
  else throw new Error(`Invalid Boolean value '${x}'`)
}

/**
 * Get configuration object from configSchema
 *
 * @param  {object} configSchema configuration schema to load config from
 * @return {object}              key val object with parsed env vars
 */
const getConfig = (configSchema) => {
  _validateConfigSchema(configSchema)
  const config = {}
  for (const [varName, varSchema] of Object.entries(configSchema)) {
    if (varSchema.type === Boolean) varSchema.type = _Boolean
    const env = varSchema.env || varName
    const rawVal = (_isNil(process.env[env]) && !varSchema.required) ? varSchema.default : process.env[env]
    try {
      config[varName] = _isNil(rawVal) ? rawVal : (varSchema.type || (x => x))(rawVal)
    } catch (e) {
      throw new CastError(varName, e)
    }
  }
  _validateConfig(config, configSchema)
  return config
}

module.exports = {
  getConfig,
  error: {
    ConfigSchemaValidationError,
    ConfigValidationError,
    CastError
  }
}
