# Envoose
[![npm version](https://badge.fury.io/js/envoose.svg)](https://www.npmjs.com/package/envoose)
[![Build Status](https://travis-ci.org/ali-essam/envoose.svg?branch=master)](https://travis-ci.org/ali-essam/envoose)
[![Coverage Status](https://coveralls.io/repos/github/ali-essam/envoose/badge.svg)](https://coveralls.io/github/ali-essam/envoose)
[![Dependencies](https://david-dm.org/ali-essam/envoose/status.svg)](https://david-dm.org/ali-essam/envoose)
[![Dev Dependencies](https://david-dm.org/ali-essam/envoose/dev-status.svg)](https://david-dm.org/ali-essam/envoose?type=dev)

Simplistic env var parser inspired by mongoose schema

## Install

```sh
# Using npm
$ npm install envoose

# Or using yarn
$ yarn add envoose
```

## Example

```js
// config.js
const envoose = require('envoose')

const configSchema = {
  MONGO_URI: { required: true },
  REQUEST_TIMEOUT: { type: Number, default: 1000 },
  EXPIRY_DATE: { type: Date },
  BOOLEAN_VAL: { type: Boolean },
  CUSTOM_VAR: { env: 'CUSTOM_ENV_VAR' },
  LIST: { type: s => s.split(',').map(Number) },
  ENUM_VALID: { type: String, enum: ['A', 'B', 'C'] },
  MATCH_VALID: { type: String, match: /.*match.*/g },
  CUSTOM_VALID: { type: Number, validator: x => x !== 10 }
  // INVALID_MIX: { required: true, default: 10 }
}

const config = envoose.getConfig(configSchema)

module.exports = config
```

## Docs

### envoose.getConfig(configSchema)

Validate and load configs object using configSchema

### ConfigSchema

A configSchema is an object that tells envoose which env vars to load and how to load them, in its most basic form, it's just a set of keys to load

```js
const configSchema = {
  FIRST_KEY: {},
  SECOND_KEY: {}
}
```

#### Options

##### required
A required key must be supplied through env vars. If the value is not available in `process.env`, `getConfig` will throw `ConfigValidationError`.

Note that `default` and `required` can't be combined.

##### default
A value to fallback to if the env var is not set.

##### env
By default the config is read from env var with the same name as the config name. If `env` is supplied, it will read from that env var instead.

##### type
Env vars are strings by default, however envoose allows you to cast them to different data types.

###### Supported Types
- `String` (default)
- `Number`
- `Date`
- `Boolean` ('true', 'yes', '1' evaluate to true, while 'false', 'no', '0' evaluate to false, `CastError` will be thrown otherwise)
- Custom types by supplying a mapping function (ex: array of numbers `s => s.split(',').map(Number)`)

##### enum
Built in validator that checks whether the value falls in one of the values in the list. Throws `ConfigValidationError` if not found in enum.

##### match
Built in validator that checks whether the value matches this regex or not. Throws `ConfigValidationError` if not matched.

##### validator
Accepts custom validation function that should return true if valid and false otherwise.
