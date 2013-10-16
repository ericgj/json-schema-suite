'use strict';

var isBrowser = require('is-browser')
  , core = isBrowser ? require('json-schema-core') : require('json-schema-core-component')
  , hyper = isBrowser ? require('json-schema-hyper') : require('json-schema-hyper-component')
  , valid = isBrowser ? require('json-schema-valid') : require('json-schema-valid-component')
  , Agent = isBrowser ? require('json-schema-agent') : require('json-schema-agent-component')
  , request = require('superagent')
  , Schema = core.Schema
  , Service = function(){ return request; }

Schema.use(valid);
Schema.use(hyper);

Agent.service(Service);

module.exports = {
  Schema:  Schema,
  Agent:  Agent,
  Validator: valid
}

