'use strict';

var isBrowser = require('is-browser')
  , assert = require('assert')
  , suite = require('json-schema-suite')
  , Agent = suite.Agent
  , Schema = suite.Schema
  , Validator = suite.Validator
  , listener = Validator.emitter()

listener.on('debug', function(e){
  console.log(e.message + " %o", e);
})

var ORIGIN = isBrowser ? window.location.origin : 'http://localhost:3000'

describe('json-schema-suite', function(){

  beforeEach( function(){
    this.agent = new Agent();
    this.agent.base(ORIGIN);
  })
  
  it('should fetch meta-schema', function(done){
    this.agent.get('/schema/meta/schema.json', function(err,corr){
      assert(!err);
      corr.instance.id = ORIGIN + "/schema/meta/schema.json"
      var schema = new Schema().parse(corr.instance);
      console.log("meta-schema: referenced: %o", schema);
      done();
    })
  })

  it('should fetch and validate valid schema against meta-schema', function(done){
    this.agent.get('/schema/valid.json', function(err,corr){
      assert(!err);
      console.log("valid: schema: %o", corr.schema);
      console.log("valid: instance: %o", corr.instance);
      assert(corr.validate());
      done();
    })
  })

  it('should fetch and validate invalid schema against meta-schema', function(done){
    this.agent.get('/schema/invalid.json', function(err,corr){
      assert(!err);
      console.log("invalid: schema: %o", corr.schema);
      console.log("invalid: instance: %o", corr.instance);
      assert(!corr.validate());
      done();
    })
  })

  it('should fetch and validate dereferenced schema against meta-schema', function(done){
    var agent = this.agent;
    agent.get('/schema/deref.json', function(err,corr){
      assert(!err);
      agent.dereference(corr.instance, function(err2,schema){
        assert(!err2);
        corr.instance = schema.toObject();
        console.log('deref: instance: %o', corr.instance);
        assert(corr.validate());
        done();
      })
    })
  })

})

