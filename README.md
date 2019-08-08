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
