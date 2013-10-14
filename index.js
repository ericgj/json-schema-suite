'use strict';

var core = require('json-schema-core')
  , hyper = require('json-schema-hyper')
  , valid = require('json-schema-valid')
  , Agent = require('json-schema-agent')
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

