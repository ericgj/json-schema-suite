;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("ericgj-json-schema-uri/index.js", function(exports, require, module){

module.exports = Uri;

var PARTS = ['protocol','authority','host','hostname','port','pathname','search','hash']

// util
var forEach = Array.forEach || function(fn){
  for (var i=0;i<this.length;++i){
    fn(this[i]);
  }
}


function Uri(str){
  if (!(this instanceof Uri)) return new Uri(str);
  this.parse(str);
  return this;
}

// parse() and canonical() are adapted from https://gist.github.com/1088850
//   -  released as public domain by author ("Yaffle") - see comments on gist

Uri.prototype.parse = function(str){
  str = (str || '').toString();
  var m = String(str).replace(/^\s+|\s+$/g, '').match(/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
  // authority = '//' + user + ':' + pass '@' + hostname + ':' port
  this.reset();
  if (m) {
    this._protocol  = m[1] || '';
    this._authority = m[2] || '';
    this._host      = m[3] || '';
    this._hostname  = m[4] || '';
    this._port      = m[5] || '';
    this._pathname  = m[6] || '';
    this._search    = m[7] || '';
    this._hash      = m[8] || '';
  }
}


forEach.call(PARTS, function(prop){
  Uri.prototype[prop] = function(str){ 
    if (arguments.length == 1){ this['_'+prop] = String(str || ''); }
    else    { return this['_'+prop]; }
  }
})

Uri.prototype.reset = function(){
  for (var i=0;i<PARTS.length;++i){
    var prop = PARTS[i]
    this['_'+prop] = '' ;
  }
}

Uri.prototype.href = 
Uri.prototype.toString = function(){
  return this.protocol() + 
         this.authority() + 
         this.pathname() +
         this.search() + 
         this.hash()
}

Uri.prototype.clone = function(){
  var uri = new this.constructor();
  for (var i=0;i<PARTS.length;++i){
    var part = PARTS[i]
    uri[part](this[part]());
  }
  return uri;
}

// URI minus the query string and hash part
Uri.prototype.baseUri = function(){
  var uri = this.clone();
  uri.search(''); uri.hash('');
  return uri;
}

Uri.prototype.base = function(){
  return this.baseUri().toString();
}

Uri.prototype.join = function(uri){
  return new this.constructor(this.canonical(uri));
}

// fragment == hash
Uri.prototype.fragment = Uri.prototype.hash;


Uri.prototype.isFragment = function(){
  return !!this.hash() && 
         !this.protocol() && !this.authority() &&
         !this.host() && !this.pathname() &&
         !this.search();
}        

Uri.prototype.fragmentPush = function(str){
  var path = this._hash
    , parts = path.split('/')
  if ('' == parts[0]) parts[0] = '#';
  parts.push(str);
  this._hash = parts.join('/');
  return str;
}

Uri.prototype.fragmentPop = function(){
  var path = this._hash
    , parts = path.split('/')
  if ('#' == parts[0]) parts.shift();
  if (''  == parts[0]) parts.shift();
  var last = parts.pop() || ''
  parts.unshift('#');
  this._hash = parts.join('/');
  return last;
}

Uri.prototype.fragmentUnshift = function(str){
  var path = this._hash
    , parts = path.split('/')
  if ('#' == parts[0]) parts.shift();
  if (''  == parts[0]) parts.shift();
  parts.unshift(str);
  parts.unshift('#');
  this._hash = parts.join('/');
  return parts.length;
}

Uri.prototype.fragmentShift = function(){
  var path = this._hash
    , parts = path.split('/')
  if ('#' == parts[0]) parts.shift();
  if (''  == parts[0]) parts.shift();
  var first = parts.shift()
  parts.unshift('#');
  this._hash = parts.join('/');
  return first;
}


Uri.prototype.canonical = function(href) {// RFC 3986

	function removeDotSegments(input) {
		var output = [];
		input.replace(/^(\.\.?(\/|$))+/, '')
			.replace(/\/(\.(\/|$))+/g, '/')
			.replace(/\/\.\.$/, '/../')
			.replace(/\/?[^\/]*/g, function (p) {
				if (p === '/..') {
					output.pop();
				} else {
					output.push(p);
				}
		});
		return output.join('').replace(/^\//, input.charAt(0) === '/' ? '/' : '');
	}

    href = href || '';
	if ('string' == typeof href) href = new this.constructor(href);
	var base = this;

	return (href.protocol() || base.protocol()) +
		(href.protocol() || href.authority() ? href.authority() : base.authority()) +
		removeDotSegments(href.protocol() || href.authority() || href.pathname().charAt(0) === '/' ? href.pathname() : (href.pathname() ? ((base.authority() && !base.pathname() ? '/' : '') + base.pathname().slice(0, base.pathname().lastIndexOf('/') + 1) + href.pathname()) : base.pathname() )) +
		(href.protocol() || href.authority() || href.pathname() ? href.search() : (href.search() || base.search() )) +
		href.hash();
}




});
require.register("component-to-function/index.js", function(exports, require, module){

/**
 * Expose `toFunction()`.
 */

module.exports = toFunction;

/**
 * Convert `obj` to a `Function`.
 *
 * @param {Mixed} obj
 * @return {Function}
 * @api private
 */

function toFunction(obj) {
  switch ({}.toString.call(obj)) {
    case '[object Object]':
      return objectToFunction(obj);
    case '[object Function]':
      return obj;
    case '[object String]':
      return stringToFunction(obj);
    case '[object RegExp]':
      return regexpToFunction(obj);
    default:
      return defaultToFunction(obj);
  }
}

/**
 * Default to strict equality.
 *
 * @param {Mixed} val
 * @return {Function}
 * @api private
 */

function defaultToFunction(val) {
  return function(obj){
    return val === obj;
  }
}

/**
 * Convert `re` to a function.
 *
 * @param {RegExp} re
 * @return {Function}
 * @api private
 */

function regexpToFunction(re) {
  return function(obj){
    return re.test(obj);
  }
}

/**
 * Convert property `str` to a function.
 *
 * @param {String} str
 * @return {Function}
 * @api private
 */

function stringToFunction(str) {
  // immediate such as "> 20"
  if (/^ *\W+/.test(str)) return new Function('_', 'return _ ' + str);

  // properties such as "name.first" or "age > 18"
  return new Function('_', 'return _.' + str);
}

/**
 * Convert `object` to a function.
 *
 * @param {Object} object
 * @return {Function}
 * @api private
 */

function objectToFunction(obj) {
  var match = {}
  for (var key in obj) {
    match[key] = typeof obj[key] === 'string'
      ? defaultToFunction(obj[key])
      : toFunction(obj[key])
  }
  return function(val){
    if (typeof val !== 'object') return false;
    for (var key in match) {
      if (!(key in val)) return false;
      if (!match[key](val[key])) return false;
    }
    return true;
  }
}

});
require.register("component-each/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var toFunction = require('to-function');
var type;

try {
  type = require('type-component');
} catch (e) {
  type = require('type');
}

/**
 * HOP reference.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Iterate the given `obj` and invoke `fn(val, i)`.
 *
 * @param {String|Array|Object} obj
 * @param {Function} fn
 * @api public
 */

module.exports = function(obj, fn){
  fn = toFunction(fn);
  switch (type(obj)) {
    case 'array':
      return array(obj, fn);
    case 'object':
      if ('number' == typeof obj.length) return array(obj, fn);
      return object(obj, fn);
    case 'string':
      return string(obj, fn);
  }
};

/**
 * Iterate string chars.
 *
 * @param {String} obj
 * @param {Function} fn
 * @api private
 */

function string(obj, fn) {
  for (var i = 0; i < obj.length; ++i) {
    fn(obj.charAt(i), i);
  }
}

/**
 * Iterate object keys.
 *
 * @param {Object} obj
 * @param {Function} fn
 * @api private
 */

function object(obj, fn) {
  for (var key in obj) {
    if (has.call(obj, key)) {
      fn(key, obj[key]);
    }
  }
}

/**
 * Iterate array-ish.
 *
 * @param {Array|Object} obj
 * @param {Function} fn
 * @api private
 */

function array(obj, fn) {
  for (var i = 0; i < obj.length; ++i) {
    fn(obj[i], i);
  }
}

});
require.register("component-type/index.js", function(exports, require, module){
/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object Error]': return 'error';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val !== val) return 'NaN';
  if (val && val.nodeType === 1) return 'element';

  return typeof val.valueOf();
};

});
require.register("component-inherit/index.js", function(exports, require, module){

module.exports = function(a, b){
  var fn = function(){};
  fn.prototype = b.prototype;
  a.prototype = new fn;
  a.prototype.constructor = a;
};
});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("ericgj-json-schema-core/index.js", function(exports, require, module){
var isBrowser = require('is-browser')
  , each = isBrowser ? require('each') : require('each-component')
  , type = isBrowser ? require('type') : require('component-type')
  , inherit = isBrowser ? require('inherit') : require('inherit-component')
  , Uri = isBrowser ? require('json-schema-uri') : require('json-schema-uri-component')
  , has = Object.hasOwnProperty

var Refs = require('./refs')
  , Correlation = require('./correlation')

module.exports = {
  Node: Node,
  Schema: Schema,
  SchemaCollection: SchemaCollection,
  SchemaArray: SchemaArray,
  Correlation: Correlation
};



///////
// abstract base class, mostly

function Node(parent){
 this.parent = parent;
 this.nodeType = 'Node';
 this._scope = undefined;
 this._refs = (parent && parent.refs()) || new Refs()
}

Node.prototype.parse = function(obj){} // subclass parse
Node.prototype.get = function(key){}   // subclass property/element accessor
Node.prototype.has = function(key){}
Node.prototype.set = function(key,val){}  // setter
Node.prototype.each = function(fn){} // iterator

Node.prototype.toObject = function(){}  // serializer
Node.prototype.toString = function(){ 
  return JSON.stringify(this.toObject());
}

Node.prototype.scope = function(id){
  var cur = this._scope || (this.parent && this.parent.scope()); 
  if (arguments.length == 0) {
    return cur; 
  } else {
    var uri = Uri(cur).join(id);
    this._scope = uri.toString();
    this._refs.addScope(this._scope,this);
  }
}

Node.prototype.refs = function(){
  return this._refs;
}

Node.prototype.root = function(){
  if (!this.parent) { return this; }
  else { return this.parent.root(); }
}

Node.prototype.eachRef = function(fn){
  this._refs.each( fn );
}

Node.prototype.addRef = function(ref,key){
  var uri = Uri(this.scope()).join(ref)
  this._refs.add(uri.toString(),this,key);
}

Node.prototype.$ = function(key){ 
  var uri = Uri(this.scope()).join(key)
  var ret = this.getId(uri)
  if (ret) return ret;
  var base = uri.base()
    , fragment = uri.fragment()
  var root = base ? this.getId(base) : this;
  if (!root) return;
  return root.getPath(fragment); 
}

Node.prototype.getId = function(uri){
  return this._refs.getScope(uri.toString());
}

// recursive get via (absolute or relative) path
Node.prototype.getPath = function(path){
  var segs = path.split('/')
    , seg = segs.shift()
    , path = segs.join('/')
  if (0 == seg.length && 0 == segs.length) return this;
  if ('#' == seg) return this.root().getPath(path); 
  if (!this.has(seg)) return; // or throw error ?
  if (0 == path.length){
    return this.get(seg);
  } else {
    return this.get(seg).getPath(path);
  }
}

function refOf(obj){
  return ("object"==type(obj) && obj['$ref']);
}

///////
// core classes


function Schema(parent){
  Node.call(this,parent);
  this.nodeType = 'Schema';
  this._properties = {};
  this._conditions = {};
}
inherit(Schema,Node);

Schema.prototype.parse = function(obj){
  if (has.call(obj,'id')) this.scope(obj.id);
  var self = this;
  each(obj, function(key,val){
    if (val == 'id') return;
    var ref = refOf(val)
    if (ref) { self.addRef(ref,key); return; }
    var klass = Schema.getType(key);
    if (klass){
      self.addCondition(key,val,klass);
    } else {
      self.addProperty(key,val);
    }
  }) 
  return this;
}

Schema.prototype.get = function(key){
  return this._conditions[key];
}

Schema.prototype.set = function(key,cond){
  this._conditions[key] = cond;
}

Schema.prototype.has = function(key){
  return has.call(this._conditions,key);
}

Schema.prototype.each = function(fn){
  each(this._conditions, fn);
}

Schema.prototype.addCondition = function(key,val,klass){
  var parsed = new klass(this).parse(val);
  if (has.call(parsed,'nodeType')){
    this.set(key,parsed);
  } else {
    this.addProperty(key,parsed);
  }
}

Schema.prototype.addProperty = function(key,val){
  this._properties[key] = val;
}

Schema.prototype.getProperty = 
Schema.prototype.property = function(key){
  return this._properties[key];
}

Schema.prototype.hasProperty = function(key){
  return has.call(this._properties,key);
}

Schema.prototype.eachProperty = function(fn){
  each(this._properties, fn);
}

Schema.prototype.toObject = function(){
  var obj = {}
  this.eachProperty( function(key,val){
    obj[key] = val;
  })
  this.each( function(key,cond){
    obj[key] = cond.toObject();
  })
  return obj;
}

// mix in each binding method into a Correlation object
Schema.prototype.bind = function(instance){
  var ret = new Correlation(this,instance);
  for (var key in Schema._bindings){
    var fn = Schema._bindings[key];
    ret[key] = fn.bind(ret);
  }
  return ret;
}

// Schema class methods

Schema.union = 
Schema.allOf = function(schemas){
  var schema = new Schema()
  schema.addCondition('allOf',[],AllOf);
  var allOf = schema.get('allOf');
  for (var i=0;i<schemas.length;++i){
    allOf.set(schemas[i]);
  }
  return schema;
}

Schema.getType = function(prop){ 
  return this._types[prop];
}

Schema.addType = function(prop,klass){
  this._types[prop] = klass;
}

Schema.addBinding = function(key, fn){
  this._bindings[key] = fn;
}

Schema.use = function(plugin){
  plugin(this);
}

Schema._types = {};
Schema._bindings = {};

///////
// inject node parse classes by default

function base(target){
  target.addType('items',Items);
  target.addType('additionalItems',AdditionalItems);
  target.addType('definitions',Definitions);
  target.addType('properties',Properties);
  target.addType('patternProperties',PatternProperties);
  target.addType('additionalProperties',AdditionalProperties);
  target.addType('dependencies',Dependencies);
  // target.addType('type',Type);
  target.addType('allOf',AllOf);
  target.addType('anyOf',AnyOf);
  target.addType('oneOf',OneOf);
  target.addType('not',Not);
}

Schema.use(base);


///////
// base node parse classes

function SchemaCollection(parent){
  Node.call(this,parent);
  this.nodeType = 'SchemaCollection';
  this._schemas = {};
}
inherit(SchemaCollection,Node);

SchemaCollection.prototype.parse = function(obj){
  var self = this;
  each(obj, function(key,val){
    var ref = refOf(val)
    if (ref) { self.addRef(ref,key); return; }
    self.addSchema(key,val);
  })
  return this;
}

SchemaCollection.prototype.get = function(key){
  return this._schemas[key];
}

SchemaCollection.prototype.set = function(key,schema){
  this._schemas[key] = schema;
}

SchemaCollection.prototype.has = function(key){
  return has.call(this._schemas,key);
}

SchemaCollection.prototype.each = function(fn){
  each(this._schemas, fn);
}

SchemaCollection.prototype.addSchema = function(key,val){
  var schema = new Schema(this).parse(val);
  this.set(key,schema);
}

SchemaCollection.prototype.toObject = function(){
  var obj = {}
  this.each( function(key,schema){
    obj[key] = schema.toObject();
  })
  return obj;
}


function SchemaArray(parent){
  Node.call(this,parent);
  this.nodeType = 'SchemaArray';
  this._schemas = [];
}
inherit(SchemaArray,Node);

SchemaArray.prototype.parse = function(obj){
  var self = this;
  each(obj, function(val,i){
    var ref = refOf(val)
    if (ref) { self.addRef(ref,i); return; }
    self.addSchema(val);
  })
  return this;
}

SchemaArray.prototype.get = function(i){
  return this._schemas[i];
}

SchemaArray.prototype.set = function(i,schema){
  if (arguments.length == 1){
    schema = i; i = undefined;
    this._schemas.push(schema);
  } else {
    this._schemas[i] = schema;
  }
}

SchemaArray.prototype.has = function(i){
  return !!this.get(i);
}

SchemaArray.prototype.each = function(fn){
  each(this._schemas, function(obj,i){ fn(i,obj); });
}

SchemaArray.prototype.addSchema = function(val){
  var schema = new Schema(this).parse(val);
  this.set(schema);
}

SchemaArray.prototype.toObject = function(){
  var obj = []
  this.each( function(i,schema){ obj.push(schema.toObject()); } );
  return obj;
}


function SchemaOrBoolean(parent){
  if (!(this instanceof SchemaOrBoolean)) return new SchemaOrBoolean(parent);
  this.parent = parent;
  return this;
}

SchemaOrBoolean.prototype.parse = function(obj){
  return (type(obj) == 'boolean' ? obj
                                 : new Schema(this.parent).parse(obj)
         );
}


///////
// concrete node parse classes

function Definitions(parent){ 
  SchemaCollection.call(this,parent); 
  this.nodeType = 'Definitions';
}
function Properties(parent){
  SchemaCollection.call(this,parent); 
  this.nodeType = 'Properties';
}
function PatternProperties(parent){
  SchemaCollection.call(this,parent); 
  this.nodeType = 'PatternProperties';
}
inherit(Definitions, SchemaCollection);
inherit(Properties, SchemaCollection);
inherit(PatternProperties, SchemaCollection);


function AllOf(parent){
  SchemaArray.call(this,parent);
  this.nodeType = 'AllOf';
}
function AnyOf(parent){
  SchemaArray.call(this,parent);
  this.nodeType = 'AnyOf';
}
function OneOf(parent){
  SchemaArray.call(this,parent);
  this.nodeType = 'OneOf';
}
inherit(AllOf, SchemaArray);
inherit(AnyOf, SchemaArray);
inherit(OneOf, SchemaArray);


function Not(parent){
  Schema.call(this,parent);
  this.nodeType = 'Not';
}
inherit(Not, Schema);


function AdditionalProperties(parent){
  SchemaOrBoolean.call(this,parent);
}
function AdditionalItems(parent){
  SchemaOrBoolean.call(this,parent);
}
inherit(AdditionalProperties,SchemaOrBoolean);
inherit(AdditionalItems,SchemaOrBoolean);


// custom node classes

function Items(parent){
  if (!(this instanceof Items)) return new Items(parent);
  this.parent = parent;
  return this;
}

Items.prototype.parse = function(obj){
  return (type(obj) == 'array' ? new SchemaArray(this.parent).parse(obj)
                               : new Schema(this.parent).parse(obj)
         );
}


function Dependencies(parent){
  Node.call(this,parent);
  this.nodeType = 'Dependencies';
  this._deps = {};
}
inherit(Dependencies,Node);

Dependencies.prototype.parse = function(obj){
  var self = this;
  each(obj, function(key,val){
    var ref = refOf(val)
    if (ref) { self.addRef(ref,key); return; }
    self.addDependency(key,val);
  })
  return this;
}

Dependencies.prototype.get = function(key){
  return this._deps[key];
}

Dependencies.prototype.set = function(key,schema){
  this._deps[key] = schema;
}

Dependencies.prototype.has = function(key){
  return has.call(this._deps,key);
}

Dependencies.prototype.each = function(fn){
  each(this._deps, fn);
}

Dependencies.prototype.addDependency = function(key,val){
  var dep = new Dependency(this).parse(val);
  this.set(key,dep);
}

Dependencies.prototype.eachSchemaDependency = function(fn){
  each(this._deps, function(key,dep){
    if (dep instanceof Schema) fn(key,dep);
  })
}

Dependencies.prototype.eachPropertyDependency = function(fn){
  each(this._deps, function(key,dep){
    if (type(dep) == 'array') fn(key,dep);
  })
}

Dependencies.prototype.toObject = function(){
  var obj = {}
  this.each( function(key,dep){ 
    if (dep.nodeType && dep.nodeType == 'Schema'){
      obj[key] = dep.toObject(); 
    } else {
      obj[key] = dep;
    }
  });
  return obj;
}


function Dependency(parent){
  if (!(this instanceof Dependency)) return new Dependency(parent);
  this.parent = parent;
  return this;
}

Dependency.prototype.parse = function(obj){
  return (type(obj) == 'array'  ? obj
                                : new Schema(this.parent).parse(obj)
         );
}


});
require.register("ericgj-json-schema-core/refs.js", function(exports, require, module){
'use strict';

var isBrowser = require('is-browser')
  ,  each = isBrowser ? require('each') : require('each-component')

module.exports = Refs;

function Refs(){
  if (!(this instanceof Refs)) return new Refs();
  this._refs = []; this._scopes = {};
  return this;
}

Refs.prototype.add = 
Refs.prototype.addRef = function(uri,node,key){
  this._refs.push([uri.toString(),node,key]);
}

Refs.prototype.each = 
Refs.prototype.eachRef = function(fn){
  each(this._refs, function(ref){ fn(ref[0],ref[1],ref[2]); })
}

Refs.prototype.addScope = function(uri,node){
  this._scopes[uri.toString()] = node;
}

Refs.prototype.getScope = function(uri){
  return this._scopes[uri.toString()];
}

/* TODO: move dereferencing elsewhere

Refs.prototype.dereference = function(node,fn,remotes){
  var self = this
  remotes = remotes || [];

  if (fn){
    this.once('ready', fn);
    this.once('error', fn);
  }
  
  this.each( function(uri,node,key){
    inlineDereference.call(self,uri,node,key) ||
      remotes.push([uri,node,key]);
  })
  
  if (remotes.length == 0) {
    self.emit('ready');
  } else {
    while (remotes.length){
      var next = remotes.shift()
      next.push(remotes.length == 0);
      asyncDereference.apply(self,next);
    }
  }
}

// private 

function inlineDereference(uri,node,key){
  var root = node.root()
    , ref = root.$(uri)  // try inline dereference by URI or JSON pointer 
  if (ref) node.set(key,ref);
  return (!!ref);
}

function asyncDereference(uri,node,key){
  var self = this, agent = this.agent
  agent.getCache(uri, function(err,ref){
    if (err){
      self.emit('error', err);
      return;
    }

    node.set(key,ref);
    if (last) self.emit('ready');

  })
}

*/

});
require.register("ericgj-json-schema-core/correlation.js", function(exports, require, module){
'use strict';

var isBrowser = require('is-browser')
  , type = isBrowser ? require('type') : require('component-type')
  , Emitter = isBrowser ? require('emitter') : require('emitter-component')

module.exports = Correlation;

function Correlation(schema,instance){
  if (!(this instanceof Correlation)) return new Correlation(schema,instance);
  this.schema = schema; this.instance = instance;
  return this;
}

/* Used by extensions (e.g. validate) to signal events */
Correlation.prototype = new Emitter();

/* 
  This is the tricky thing, since you have to correlate movement down the instance
  with movement down the schema. This really requires validation plugin,
  since you need the semantics of oneOf, anyOf, etc.

  However, here the core can provide a naive implementation that simply 
  walks down the schema.get('properties') or schema.get('items').

  A validation plugin simply has to provide a `subschema(prop)` binding function
  to deal with resolving multiple potential paths.

*/
  
Correlation.prototype.subschema = function(prop){
  var schema = this.schema
    , items = schema.get('items')
  if (items) {
    if (items.nodeType == 'SchemaArray'){
      return items.get(prop); 
    } else {
      return items;
    }
  }
  var props = schema.get('properties') 
  if (!props) return;
  return props.get(prop);
}

/*
 * Coerce (copy of) instance to schema type and apply any default
 * 'Apply default' == 
 *    Merge in defaults if type = 'object', otherwise set default
 *    value if instance is undefined.
 *
 * @returns new Correlation
 *
 */
Correlation.prototype.coerce = function(){
  if (!this.schema) return;
  var schema = this.schema
    , schemaType = schema.property('type')
    , instance = coerceType(this.instance,schemaType);
  if (schema.hasProperty('default')){
    var def = JSON.parse(JSON.stringify(
                schema.property('default')
              ));
    instance = mergeDefault(instance,def);
  }
  return schema.bind(instance);
}


/////////////// TODO: Deprecate these? 
// Traversal through the instance should be done through links

Correlation.prototype.get = function(prop){
  if (!(this.schema && this.instance)) return;
  var instance = this.instance[prop]
  if (!instance) return;
  var schema = this.subschema(prop)
  if (!schema) return;
  return schema.bind(instance);
}

Correlation.prototype.$ = function(path){ return this.getPath(path); }

Correlation.prototype.getPath = function(path){
  if (0==path.length) return this;
  var parts = path.split('/')
    , prop = parts.shift()
    , rest = parts.join('/')
  if ('#' == prop) return this.getPath(rest);
  var branch = this.get(prop)
  if (!branch) return;
  return branch.getPath(rest);
}

////////////////


// utils

// Note: always returns copy
function coerceType(instance,t){
  var actual = type(instance)
    , ret
  t = t || actual; // if type not specified, use actual
  if (t == actual && t !== 'undefined') return JSON.parse(JSON.stringify(instance));
  switch(t){
    case 'array':
    ret = (instance === undefined ? [] : [JSON.parse(JSON.stringify(instance))] );
    break;

    case 'boolean':
    ret = !!instance;
    break;

    case 'integer':
    ret = parseInt(instance);
    break;

    case 'null':
    ret = null;
    break;

    case 'number':
    ret = (instance === undefined) || 
          (instance === null) || 
          ((instance/1 % 1) == 0) ? parseInt(instance) : parseFloat(instance);
    break;

    case 'object':
    ret = {}; // note does not attempt to coerce array (or anything else) into object
    break;

    case 'string':
    ret = (instance === undefined) || 
          (instance === null) ? "" : instance.toString();
    break;

    default:
    ret = undefined;
    break;
  }
  return ret;
}

function mergeDefault(instance,def){
  var t = type(def)
    , ret
  instance = coerceType(instance,t);
  if (t == 'object'){
    for (var p in def) instance[p] = instance[p] || def[p];
    ret = instance;
  } else {
    ret = (instance === undefined) ? def : instance;
  }
  return ret;
}


});
require.register("ericgj-uritemplate/bin/uritemplate.js", function(exports, require, module){
/*global unescape, module, define, window, global*/

/*
 UriTemplate Copyright (c) 2012-2013 Franz Antesberger. All Rights Reserved.
 Available via the MIT license.
*/

(function (exportCallback) {
    "use strict";

var UriTemplateError = (function () {

    function UriTemplateError (options) {
        this.options = options;
    }

    UriTemplateError.prototype.toString = function () {
        if (JSON && JSON.stringify) {
            return JSON.stringify(this.options);
        }
        else {
            return this.options;
        }
    };

    return UriTemplateError;
}());

var objectHelper = (function () {
    function isArray (value) {
        return Object.prototype.toString.apply(value) === '[object Array]';
    }

    function isString (value) {
        return Object.prototype.toString.apply(value) === '[object String]';
    }
    
    function isNumber (value) {
        return Object.prototype.toString.apply(value) === '[object Number]';
    }
    
    function isBoolean (value) {
        return Object.prototype.toString.apply(value) === '[object Boolean]';
    }
    
    function join (arr, separator) {
        var
            result = '',
            first = true,
            index;
        for (index = 0; index < arr.length; index += 1) {
            if (first) {
                first = false;
            }
            else {
                result += separator;
            }
            result += arr[index];
        }
        return result;
    }

    function map (arr, mapper) {
        var
            result = [],
            index = 0;
        for (; index < arr.length; index += 1) {
            result.push(mapper(arr[index]));
        }
        return result;
    }

    function filter (arr, predicate) {
        var
            result = [],
            index = 0;
        for (; index < arr.length; index += 1) {
            if (predicate(arr[index])) {
                result.push(arr[index]);
            }
        }
        return result;
    }

    function deepFreezeUsingObjectFreeze (object) {
        if (typeof object !== "object" || object === null) {
            return object;
        }
        Object.freeze(object);
        var property, propertyName;
        for (propertyName in object) {
            if (object.hasOwnProperty(propertyName)) {
                property = object[propertyName];
                // be aware, arrays are 'object', too
                if (typeof property === "object") {
                    deepFreeze(property);
                }
            }
        }
        return object;
    }

    function deepFreeze (object) {
        if (typeof Object.freeze === 'function') {
            return deepFreezeUsingObjectFreeze(object);
        }
        return object;
    }


    return {
        isArray: isArray,
        isString: isString,
        isNumber: isNumber,
        isBoolean: isBoolean,
        join: join,
        map: map,
        filter: filter,
        deepFreeze: deepFreeze
    };
}());

var charHelper = (function () {

    function isAlpha (chr) {
        return (chr >= 'a' && chr <= 'z') || ((chr >= 'A' && chr <= 'Z'));
    }

    function isDigit (chr) {
        return chr >= '0' && chr <= '9';
    }

    function isHexDigit (chr) {
        return isDigit(chr) || (chr >= 'a' && chr <= 'f') || (chr >= 'A' && chr <= 'F');
    }

    return {
        isAlpha: isAlpha,
        isDigit: isDigit,
        isHexDigit: isHexDigit
    };
}());

var pctEncoder = (function () {
    var utf8 = {
        encode: function (chr) {
            // see http://ecmanaut.blogspot.de/2006/07/encoding-decoding-utf8-in-javascript.html
            return unescape(encodeURIComponent(chr));
        },
        numBytes: function (firstCharCode) {
            if (firstCharCode <= 0x7F) {
                return 1;
            }
            else if (0xC2 <= firstCharCode && firstCharCode <= 0xDF) {
                return 2;
            }
            else if (0xE0 <= firstCharCode && firstCharCode <= 0xEF) {
                return 3;
            }
            else if (0xF0 <= firstCharCode && firstCharCode <= 0xF4) {
                return 4;
            }
            // no valid first octet
            return 0;
        },
        isValidFollowingCharCode: function (charCode) {
            return 0x80 <= charCode && charCode <= 0xBF;
        }
    };

    /**
     * encodes a character, if needed or not.
     * @param chr
     * @return pct-encoded character
     */
    function encodeCharacter (chr) {
        var
            result = '',
            octets = utf8.encode(chr),
            octet,
            index;
        for (index = 0; index < octets.length; index += 1) {
            octet = octets.charCodeAt(index);
            result += '%' + (octet < 0x10 ? '0' : '') + octet.toString(16).toUpperCase();
        }
        return result;
    }

    /**
     * Returns, whether the given text at start is in the form 'percent hex-digit hex-digit', like '%3F'
     * @param text
     * @param start
     * @return {boolean|*|*}
     */
    function isPercentDigitDigit (text, start) {
        return text.charAt(start) === '%' && charHelper.isHexDigit(text.charAt(start + 1)) && charHelper.isHexDigit(text.charAt(start + 2));
    }

    /**
     * Parses a hex number from start with length 2.
     * @param text a string
     * @param start the start index of the 2-digit hex number
     * @return {Number}
     */
    function parseHex2 (text, start) {
        return parseInt(text.substr(start, 2), 16);
    }

    /**
     * Returns whether or not the given char sequence is a correctly pct-encoded sequence.
     * @param chr
     * @return {boolean}
     */
    function isPctEncoded (chr) {
        if (!isPercentDigitDigit(chr, 0)) {
            return false;
        }
        var firstCharCode = parseHex2(chr, 1);
        var numBytes = utf8.numBytes(firstCharCode);
        if (numBytes === 0) {
            return false;
        }
        for (var byteNumber = 1; byteNumber < numBytes; byteNumber += 1) {
            if (!isPercentDigitDigit(chr, 3*byteNumber) || !utf8.isValidFollowingCharCode(parseHex2(chr, 3*byteNumber + 1))) {
                return false;
            }
        }
        return true;
    }

    /**
     * Reads as much as needed from the text, e.g. '%20' or '%C3%B6'. It does not decode!
     * @param text
     * @param startIndex
     * @return the character or pct-string of the text at startIndex
     */
    function pctCharAt(text, startIndex) {
        var chr = text.charAt(startIndex);
        if (!isPercentDigitDigit(text, startIndex)) {
            return chr;
        }
        var utf8CharCode = parseHex2(text, startIndex + 1);
        var numBytes = utf8.numBytes(utf8CharCode);
        if (numBytes === 0) {
            return chr;
        }
        for (var byteNumber = 1; byteNumber < numBytes; byteNumber += 1) {
            if (!isPercentDigitDigit(text, startIndex + 3 * byteNumber) || !utf8.isValidFollowingCharCode(parseHex2(text, startIndex + 3 * byteNumber + 1))) {
                return chr;
            }
        }
        return text.substr(startIndex, 3 * numBytes);
    }

    return {
        encodeCharacter: encodeCharacter,
        isPctEncoded: isPctEncoded,
        pctCharAt: pctCharAt
    };
}());

var rfcCharHelper = (function () {

    /**
     * Returns if an character is an varchar character according 2.3 of rfc 6570
     * @param chr
     * @return (Boolean)
     */
    function isVarchar (chr) {
        return charHelper.isAlpha(chr) || charHelper.isDigit(chr) || chr === '_' || pctEncoder.isPctEncoded(chr);
    }

    /**
     * Returns if chr is an unreserved character according 1.5 of rfc 6570
     * @param chr
     * @return {Boolean}
     */
    function isUnreserved (chr) {
        return charHelper.isAlpha(chr) || charHelper.isDigit(chr) || chr === '-' || chr === '.' || chr === '_' || chr === '~';
    }

    /**
     * Returns if chr is an reserved character according 1.5 of rfc 6570
     * or the percent character mentioned in 3.2.1.
     * @param chr
     * @return {Boolean}
     */
    function isReserved (chr) {
        return chr === ':' || chr === '/' || chr === '?' || chr === '#' || chr === '[' || chr === ']' || chr === '@' || chr === '!' || chr === '$' || chr === '&' || chr === '(' ||
            chr === ')' || chr === '*' || chr === '+' || chr === ',' || chr === ';' || chr === '=' || chr === "'";
    }

    return {
        isVarchar: isVarchar,
        isUnreserved: isUnreserved,
        isReserved: isReserved
    };

}());

/**
 * encoding of rfc 6570
 */
var encodingHelper = (function () {

    function encode (text, passReserved) {
        var
            result = '',
            index,
            chr = '';
        if (typeof text === "number" || typeof text === "boolean") {
            text = text.toString();
        }
        for (index = 0; index < text.length; index += chr.length) {
            chr = text.charAt(index);
            result += rfcCharHelper.isUnreserved(chr) || (passReserved && rfcCharHelper.isReserved(chr)) ? chr : pctEncoder.encodeCharacter(chr);
        }
        return result;
    }

    function encodePassReserved (text) {
        return encode(text, true);
    }

    function encodeLiteralCharacter (literal, index) {
        var chr = pctEncoder.pctCharAt(literal, index);
        if (chr.length > 1) {
            return chr;
        }
        else {
            return rfcCharHelper.isReserved(chr) || rfcCharHelper.isUnreserved(chr) ? chr : pctEncoder.encodeCharacter(chr);
        }
    }

    function encodeLiteral (literal) {
        var
            result = '',
            index,
            chr = '';
        for (index = 0; index < literal.length; index += chr.length) {
            chr = pctEncoder.pctCharAt(literal, index);
            if (chr.length > 1) {
                result += chr;
            }
            else {
                result += rfcCharHelper.isReserved(chr) || rfcCharHelper.isUnreserved(chr) ? chr : pctEncoder.encodeCharacter(chr);
            }
        }
        return result;
    }

    return {
        encode: encode,
        encodePassReserved: encodePassReserved,
        encodeLiteral: encodeLiteral,
        encodeLiteralCharacter: encodeLiteralCharacter
    };

}());


// the operators defined by rfc 6570
var operators = (function () {

    var
        bySymbol = {};

    function create (symbol) {
        bySymbol[symbol] = {
            symbol: symbol,
            separator: (symbol === '?') ? '&' : (symbol === '' || symbol === '+' || symbol === '#') ? ',' : symbol,
            named: symbol === ';' || symbol === '&' || symbol === '?',
            ifEmpty: (symbol === '&' || symbol === '?') ? '=' : '',
            first: (symbol === '+' ) ? '' : symbol,
            encode: (symbol === '+' || symbol === '#') ? encodingHelper.encodePassReserved : encodingHelper.encode,
            toString: function () {
                return this.symbol;
            }
        };
    }

    create('');
    create('+');
    create('#');
    create('.');
    create('/');
    create(';');
    create('?');
    create('&');
    return {
        valueOf: function (chr) {
            if (bySymbol[chr]) {
                return bySymbol[chr];
            }
            if ("=,!@|".indexOf(chr) >= 0) {
                return null;
            }
            return bySymbol[''];
        }
    };
}());


/**
 * Detects, whether a given element is defined in the sense of rfc 6570
 * Section 2.3 of the RFC makes clear defintions:
 * * undefined and null are not defined.
 * * the empty string is defined
 * * an array ("list") is defined, if it is not empty (even if all elements are not defined)
 * * an object ("map") is defined, if it contains at least one property with defined value
 * @param object
 * @return {Boolean}
 */
function isDefined (object) {
    var
        propertyName;
    if (object === null || object === undefined) {
        return false;
    }
    if (objectHelper.isArray(object)) {
        // Section 2.3: A variable defined as a list value is considered undefined if the list contains zero members
        return object.length > 0;
    }
    if (typeof object === "string" || typeof object === "number" || typeof object === "boolean") {
        // falsy values like empty strings, false or 0 are "defined"
        return true;
    }
    // else Object
    for (propertyName in object) {
        if (object.hasOwnProperty(propertyName) && isDefined(object[propertyName])) {
            return true;
        }
    }
    return false;
}

var LiteralExpression = (function () {
    function LiteralExpression (literal) {
        this.literal = encodingHelper.encodeLiteral(literal);
    }

    LiteralExpression.prototype.expand = function () {
        return this.literal;
    };

    LiteralExpression.prototype.toString = LiteralExpression.prototype.expand;

    return LiteralExpression;
}());

var parse = (function () {

    function parseExpression (expressionText) {
        var
            operator,
            varspecs = [],
            varspec = null,
            varnameStart = null,
            maxLengthStart = null,
            index,
            chr = '';

        function closeVarname () {
            var varname = expressionText.substring(varnameStart, index);
            if (varname.length === 0) {
                throw new UriTemplateError({expressionText: expressionText, message: "a varname must be specified", position: index});
            }
            varspec = {varname: varname, exploded: false, maxLength: null};
            varnameStart = null;
        }

        function closeMaxLength () {
            if (maxLengthStart === index) {
                throw new UriTemplateError({expressionText: expressionText, message: "after a ':' you have to specify the length", position: index});
            }
            varspec.maxLength = parseInt(expressionText.substring(maxLengthStart, index), 10);
            maxLengthStart = null;
        }

        operator = (function (operatorText) {
            var op = operators.valueOf(operatorText);
            if (op === null) {
                throw new UriTemplateError({expressionText: expressionText, message: "illegal use of reserved operator", position: index, operator: operatorText});
            }
            return op;
        }(expressionText.charAt(0)));
        index = operator.symbol.length;

        varnameStart = index;

        for (; index < expressionText.length; index += chr.length) {
            chr = pctEncoder.pctCharAt(expressionText, index);

            if (varnameStart !== null) {
                // the spec says: varname =  varchar *( ["."] varchar )
                // so a dot is allowed except for the first char
                if (chr === '.') {
                    if (varnameStart === index) {
                        throw new UriTemplateError({expressionText: expressionText, message: "a varname MUST NOT start with a dot", position: index});
                    }
                    continue;
                }
                if (rfcCharHelper.isVarchar(chr)) {
                    continue;
                }
                closeVarname();
            }
            if (maxLengthStart !== null) {
                if (index === maxLengthStart && chr === '0') {
                    throw new UriTemplateError({expressionText: expressionText, message: "A :prefix must not start with digit 0", position: index});
                }
                if (charHelper.isDigit(chr)) {
                    if (index - maxLengthStart >= 4) {
                        throw new UriTemplateError({expressionText: expressionText, message: "A :prefix must have max 4 digits", position: index});
                    }
                    continue;
                }
                closeMaxLength();
            }
            if (chr === ':') {
                if (varspec.maxLength !== null) {
                    throw new UriTemplateError({expressionText: expressionText, message: "only one :maxLength is allowed per varspec", position: index});
                }
                if (varspec.exploded) {
                    throw new UriTemplateError({expressionText: expressionText, message: "an exploeded varspec MUST NOT be varspeced", position: index});
                }
                maxLengthStart = index + 1;
                continue;
            }
            if (chr === '*') {
                if (varspec === null) {
                    throw new UriTemplateError({expressionText: expressionText, message: "exploded without varspec", position: index});
                }
                if (varspec.exploded) {
                    throw new UriTemplateError({expressionText: expressionText, message: "exploded twice", position: index});
                }
                if (varspec.maxLength) {
                    throw new UriTemplateError({expressionText: expressionText, message: "an explode (*) MUST NOT follow to a prefix", position: index});
                }
                varspec.exploded = true;
                continue;
            }
            // the only legal character now is the comma
            if (chr === ',') {
                varspecs.push(varspec);
                varspec = null;
                varnameStart = index + 1;
                continue;
            }
            throw new UriTemplateError({expressionText: expressionText, message: "illegal character", character: chr, position: index});
        } // for chr
        if (varnameStart !== null) {
            closeVarname();
        }
        if (maxLengthStart !== null) {
            closeMaxLength();
        }
        varspecs.push(varspec);
        return new VariableExpression(expressionText, operator, varspecs);
    }

    function parse (uriTemplateText) {
        // assert filled string
        var
            index,
            chr,
            expressions = [],
            braceOpenIndex = null,
            literalStart = 0;
        for (index = 0; index < uriTemplateText.length; index += 1) {
            chr = uriTemplateText.charAt(index);
            if (literalStart !== null) {
                if (chr === '}') {
                    throw new UriTemplateError({templateText: uriTemplateText, message: "unopened brace closed", position: index});
                }
                if (chr === '{') {
                    if (literalStart < index) {
                        expressions.push(new LiteralExpression(uriTemplateText.substring(literalStart, index)));
                    }
                    literalStart = null;
                    braceOpenIndex = index;
                }
                continue;
            }

            if (braceOpenIndex !== null) {
                // here just { is forbidden
                if (chr === '{') {
                    throw new UriTemplateError({templateText: uriTemplateText, message: "brace already opened", position: index});
                }
                if (chr === '}') {
                    if (braceOpenIndex + 1 === index) {
                        throw new UriTemplateError({templateText: uriTemplateText, message: "empty braces", position: braceOpenIndex});
                    }
                    try {
                        expressions.push(parseExpression(uriTemplateText.substring(braceOpenIndex + 1, index)));
                    }
                    catch (error) {
                        if (error.prototype === UriTemplateError.prototype) {
                            throw new UriTemplateError({templateText: uriTemplateText, message: error.options.message, position: braceOpenIndex + error.options.position, details: error.options});
                        }
                        throw error;
                    }
                    braceOpenIndex = null;
                    literalStart = index + 1;
                }
                continue;
            }
            throw new Error('reached unreachable code');
        }
        if (braceOpenIndex !== null) {
            throw new UriTemplateError({templateText: uriTemplateText, message: "unclosed brace", position: braceOpenIndex});
        }
        if (literalStart < uriTemplateText.length) {
            expressions.push(new LiteralExpression(uriTemplateText.substr(literalStart)));
        }
        return new UriTemplate(uriTemplateText, expressions);
    }

    return parse;
}());

var VariableExpression = (function () {
    // helper function if JSON is not available
    function prettyPrint (value) {
        return (JSON && JSON.stringify) ? JSON.stringify(value) : value;
    }

    function isEmpty (value) {
        if (!isDefined(value)) {
            return true;
        }
        if (objectHelper.isString(value)) {
            return value === '';
        }
        if (objectHelper.isNumber(value) || objectHelper.isBoolean(value)) {
            return false;
        }
        if (objectHelper.isArray(value)) {
            return value.length === 0;
        }
        for (var propertyName in value) {
            if (value.hasOwnProperty(propertyName)) {
                return false;
            }
        }
        return true;
    }

    function propertyArray (object) {
        var
            result = [],
            propertyName;
        for (propertyName in object) {
            if (object.hasOwnProperty(propertyName)) {
                result.push({name: propertyName, value: object[propertyName]});
            }
        }
        return result;
    }

    function VariableExpression (templateText, operator, varspecs) {
        this.templateText = templateText;
        this.operator = operator;
        this.varspecs = varspecs;
    }

    VariableExpression.prototype.toString = function () {
        return this.templateText;
    };

    function expandSimpleValue(varspec, operator, value) {
        var result = '';
        value = value.toString();
        if (operator.named) {
            result += encodingHelper.encodeLiteral(varspec.varname);
            if (value === '') {
                result += operator.ifEmpty;
                return result;
            }
            result += '=';
        }
        if (varspec.maxLength !== null) {
            value = value.substr(0, varspec.maxLength);
        }
        result += operator.encode(value);
        return result;
    }

    function valueDefined (nameValue) {
        return isDefined(nameValue.value);
    }

    function expandNotExploded(varspec, operator, value) {
        var
            arr = [],
            result = '';
        if (operator.named) {
            result += encodingHelper.encodeLiteral(varspec.varname);
            if (isEmpty(value)) {
                result += operator.ifEmpty;
                return result;
            }
            result += '=';
        }
        if (objectHelper.isArray(value)) {
            arr = value;
            arr = objectHelper.filter(arr, isDefined);
            arr = objectHelper.map(arr, operator.encode);
            result += objectHelper.join(arr, ',');
        }
        else {
            arr = propertyArray(value);
            arr = objectHelper.filter(arr, valueDefined);
            arr = objectHelper.map(arr, function (nameValue) {
                return operator.encode(nameValue.name) + ',' + operator.encode(nameValue.value);
            });
            result += objectHelper.join(arr, ',');
        }
        return result;
    }

    function expandExplodedNamed (varspec, operator, value) {
        var
            isArray = objectHelper.isArray(value),
            arr = [];
        if (isArray) {
            arr = value;
            arr = objectHelper.filter(arr, isDefined);
            arr = objectHelper.map(arr, function (listElement) {
                var tmp = encodingHelper.encodeLiteral(varspec.varname);
                if (isEmpty(listElement)) {
                    tmp += operator.ifEmpty;
                }
                else {
                    tmp += '=' + operator.encode(listElement);
                }
                return tmp;
            });
        }
        else {
            arr = propertyArray(value);
            arr = objectHelper.filter(arr, valueDefined);
            arr = objectHelper.map(arr, function (nameValue) {
                var tmp = encodingHelper.encodeLiteral(nameValue.name);
                if (isEmpty(nameValue.value)) {
                    tmp += operator.ifEmpty;
                }
                else {
                    tmp += '=' + operator.encode(nameValue.value);
                }
                return tmp;
            });
        }
        return objectHelper.join(arr, operator.separator);
    }

    function expandExplodedUnnamed (operator, value) {
        var
            arr = [],
            result = '';
        if (objectHelper.isArray(value)) {
            arr = value;
            arr = objectHelper.filter(arr, isDefined);
            arr = objectHelper.map(arr, operator.encode);
            result += objectHelper.join(arr, operator.separator);
        }
        else {
            arr = propertyArray(value);
            arr = objectHelper.filter(arr, function (nameValue) {
                return isDefined(nameValue.value);
            });
            arr = objectHelper.map(arr, function (nameValue) {
                return operator.encode(nameValue.name) + '=' + operator.encode(nameValue.value);
            });
            result += objectHelper.join(arr, operator.separator);
        }
        return result;
    }


    VariableExpression.prototype.expand = function (variables) {
        var
            expanded = [],
            index,
            varspec,
            value,
            valueIsArr,
            oneExploded = false,
            operator = this.operator;

        // expand each varspec and join with operator's separator
        for (index = 0; index < this.varspecs.length; index += 1) {
            varspec = this.varspecs[index];
            value = variables[varspec.varname];
            // if (!isDefined(value)) {
            // if (variables.hasOwnProperty(varspec.name)) {
            if (value === null || value === undefined) {
                continue;
            }
            if (varspec.exploded) {
                oneExploded = true;
            }
            valueIsArr = objectHelper.isArray(value);
            if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
                expanded.push(expandSimpleValue(varspec, operator, value));
            }
            else if (varspec.maxLength && isDefined(value)) {
                // 2.4.1 of the spec says: "Prefix modifiers are not applicable to variables that have composite values."
                throw new Error('Prefix modifiers are not applicable to variables that have composite values. You tried to expand ' + this + " with " + prettyPrint(value));
            }
            else if (!varspec.exploded) {
                if (operator.named || !isEmpty(value)) {
                    expanded.push(expandNotExploded(varspec, operator, value));
                }
            }
            else if (isDefined(value)) {
                if (operator.named) {
                    expanded.push(expandExplodedNamed(varspec, operator, value));
                }
                else {
                    expanded.push(expandExplodedUnnamed(operator, value));
                }
            }
        }

        if (expanded.length === 0) {
            return "";
        }
        else {
            return operator.first + objectHelper.join(expanded, operator.separator);
        }
    };

    return VariableExpression;
}());

var UriTemplate = (function () {
    function UriTemplate (templateText, expressions) {
        this.templateText = templateText;
        this.expressions = expressions;
        objectHelper.deepFreeze(this);
    }

    UriTemplate.prototype.toString = function () {
        return this.templateText;
    };

    UriTemplate.prototype.expand = function (variables) {
        // this.expressions.map(function (expression) {return expression.expand(variables);}).join('');
        var
            index,
            result = '';
        for (index = 0; index < this.expressions.length; index += 1) {
            result += this.expressions[index].expand(variables);
        }
        return result;
    };

    UriTemplate.parse = parse;
    UriTemplate.UriTemplateError = UriTemplateError;
    return UriTemplate;
}());

    exportCallback(UriTemplate);

}(function (UriTemplate) {
        "use strict";
        // export UriTemplate, when module is present, or pass it to window or global
        if (typeof module !== "undefined") {
            module.exports = UriTemplate;
        }
        else if (typeof define === "function") {
            define([],function() {
                return UriTemplate;
            });
        }
        else if (typeof window !== "undefined") {
            window.UriTemplate = UriTemplate;
        }
        else {
            global.UriTemplate = UriTemplate;
        }
    }
));

});
require.register("component-select/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var toFunction = require('to-function');

/**
 * Filter the given `arr` with callback `fn(val, i)`,
 * when a truthy value is return then `val` is included
 * in the array returned.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @return {Array}
 * @api public
 */

module.exports = function(arr, fn){
  var ret = [];
  fn = toFunction(fn);
  for (var i = 0; i < arr.length; ++i) {
    if (fn(arr[i], i)) {
      ret.push(arr[i]);
    }
  }
  return ret;
};

});
require.register("component-find/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var toFunction = require('to-function');

/**
 * Find the first value in `arr` with when `fn(val, i)` is truthy.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @return {Array}
 * @api public
 */

module.exports = function(arr, fn){
  // callback
  if ('function' != typeof fn) {
    if (Object(fn) === fn) fn = objectToFunction(fn);
    else fn = toFunction(fn);
  }

  // filter
  for (var i = 0, len = arr.length; i < len; ++i) {
    if (fn(arr[i], i)) return arr[i];
  }
};

/**
 * Convert `obj` into a match function.
 *
 * @param {Object} obj
 * @return {Function}
 * @api private
 */

function objectToFunction(obj) {
  return function(o){
    for (var key in obj) {
      if (o[key] != obj[key]) return false;
    }
    return true;
  }
}
});
require.register("ericgj-json-schema-hyper/index.js", function(exports, require, module){
'use strict';

var isBrowser = require('is-browser')
  , core = isBrowser ? require('json-schema-core') : require('json-schema-core-component')
  , uritemplate = require('uritemplate')
  , Node = core.Node
  , Schema = core.Schema
  , inherit = isBrowser ? require('inherit') : require('inherit-component')
  , each = isBrowser ? require('each') : require('each-component')
  , type = isBrowser ? require('type') : require('component-type')
  , select = isBrowser ? require('select') : require('select-component')
  , find   = require('find')
  , has  = Object.hasOwnProperty

// Schema plugin, use like `Schema.use(require('json-schema-hyper'))`

module.exports = function(target){

  target.addType('links', Links);

  target.addBinding('links', linksBinding);
  target.addBinding('rel', relBinding);
  target.addBinding('mediaType', mediaTypeBinding);
  target.addBinding('alternate', alternateBinding);
  target.addBinding('getRoot', getRootBinding);

  target.prototype.resolveLinks = function(instance){
    var links = this.get('links');
    if (!links) return;
    return links.resolve(instance);
  }

}

///// methods to be bound to Correlation objects

function linksBinding(){
  return this.resolveLinks ? this.resolveLinks()
                           : this.schema.resolveLinks(this.instance);
}

function relBinding(rel,filter){
  var links = this.links();
  if ('array' == type(links)){
    var ret = []
    for (var i=0;i<links.length;++i){
      ret.push(links[i].rel(rel,filter));
    }
    return ret;
  } else {
    return links.rel(rel,filter);
  }
}

function mediaTypeBinding(mediaType,filter){
  var links = this.links();
  if ('array' == type(links)){
    var ret = []
    for (var i=0;i<links.length;++i){
      ret.push(links[i].mediaType(mediaType,filter));
    }
    return ret;
  } else {
    return links.mediaType(mediaType,filter);
  }
}

function alternateBinding(mediaType){
  var links = this.links();
  if ('array' == type(links)){
    var ret = []
    for (var i=0;i<links.length;++i){
      ret.push(links[i].alternate(mediaType));
    }
    return ret;
  } else {
    return links.alternate(mediaType);
  }
}

// this is assuming the schema describes the whole instance, not already
// the root instance.

function getRootBinding(){
  if (!(this.schema && this.instance)) return;
  var root = this.rel('root')
  if (!root) return this;
  return this.getPath(root.get('href')); 
}

  

///// Links

function Links(parent){
  Node.call(this,parent);
  this.nodeType = 'Links';
  this._links = [];
}
inherit(Links,Node);

Links.prototype.parse = function(obj){
  for (var i=0;i<obj.length;++i){
    var link = obj[i]
      , ref = refOf(link)
    if (ref) { this.addRef(ref,i); continue; }
    this.addLink(link);
  }
  return this;
}

// custom finders for typical cases

Links.prototype.rel = function(rel,obj){
  return this.find( function(link){
    rel = rel.toLowerCase();
    var found = rel == link.get('rel')
    if (found && obj){
      for (var key in obj){
        if (obj[key] !== link.get(key)){
          found = false; break;
        }
      }
    }
    return found;
  })
}

Links.prototype.mediaType = function(mediaType,obj){
  return this.find( function(link){
    var found = mediaType == link.get('mediaType')
    if (found && obj){
      for (var key in obj){
        if (obj[key] !== link.get(key)){
          found = false; break;
        }
      }
    }
    return found;
  })
}

Links.prototype.alternate = function(mediaType){
  return this.mediaType(mediaType, {rel: 'alternate'});
}

Links.prototype.find = function(fn){
  return find(this._links,fn);
}

Links.prototype.select = function(fn){
  return select(this._links,fn);
}

Links.prototype.each = function(fn){
  each(this._links, function(link,i){ fn(i,link); });
}

Links.prototype.get = function(i){
  return this._links[i];
}

Links.prototype.set = function(i,link){
  if (arguments.length == 1){
    link = i; i = undefined;
    this._links.push(link);
  } else {
    this._links[i] = link;
  }
}

Links.prototype.has = function(i){
  return !!this.get(i);
}

Links.prototype.addLink = function(obj){
  var link = new Link(this).parse(obj);
  this.set(link);
}

Links.prototype.toObject = function(){
  var obj = []
  this.each( function(i,link){
    obj.push(link.toObject());
  })
  return obj;
}

Links.prototype.resolve = function(instance){
  var ret
  if ('array' == type(instance)){
    ret = []
    var self = this;
    each(instance, function(record){
      ret.push( resolvedLinksFor.call(self,record) );
    })
  } else {
    ret = resolvedLinksFor.call(this,instance);
  }
  return ret;
}

// private

function resolvedLinksFor(instance){
  var ret = new Links();
  this.each(function(i,link){
    var resolved = link.resolve(instance);
    if (resolved) ret.set(resolved);
  })
  return ret;
}

///// Link

function Link(parent){
  Node.call(this,parent);
  this.nodeType = 'Link';
  this._attributes = {};
}
inherit(Link,Node);

Link.prototype.parse = function(obj){
  this.set('method','GET');  // default
  for (var key in obj) {
    var attr = obj[key]
      , ref = refOf(attr)
    if (ref) { this.addRef(ref,key); continue; }
    this.set(key,attr);
  }
  return this;
}

Link.prototype.each = function(fn){
  each(this._attributes,fn);
}

Link.prototype.attribute = 
Link.prototype.get = function(key){
  return this._attributes[key];
}

Link.prototype.set = function(key,val){
  switch(key){
    case "schema":
    case "targetSchema":
      if (val.nodeType && val.nodeType == 'Schema'){
        this._attributes[key] = val;
      } else {
        this._attributes[key] = this.parseSchema(key,val);
      }
      break;
    case "rel":
      this._attributes[key] = val.toLowerCase();
      break;
    default:
      this._attributes[key] = val;
  }
}

Link.prototype.has = function(key){
  return (has.call(this._attributes,key));
}

Link.prototype.attributes = function(){
  return this._attributes;
}

Link.prototype.parseSchema = function(key,obj){
  var schema = new Schema(this).parse(obj)
  return schema;
}

Link.prototype.toObject = function(){
  var obj = {}
  this.each( function(key,val){
    switch(key){
      case "schema":
      case "targetSchema":
        obj[key] = val.toObject();
        break;
      default:
        obj[key] = val;
        break;
    }
  })
  return obj;
}

Link.prototype.resolve = function(instance){
  var obj = {}
    , href = this.get('href')
  if (!linkTemplateExpandable(href,instance)) return;
  this.each(function(key,prop){
    if ("href" == key){
      obj[key] = uritemplate.parse(prop).expand(instance);
    } else {
      obj[key] = prop;
    }
  })
  return new Link().parse(obj);
}

function linkTemplateExpandable(tmpl,instance){
  var pattern = /\{([^}]+)\}/g
    , tokenpatt = /[+#.\/;?&]{0,1}([^*:]+)/i
    , match
  while (match = pattern.exec(tmpl)){ 
    var submatch = tokenpatt.exec(match[1])
    if (submatch){
      var tokens = submatch[1].split(',');
      for (var i=0;i<tokens.length;++i){
        if (!has.call(instance,tokens[i])) return false;
      }
    }
  }
  return true;
}


// utils

function refOf(obj){
  return ("object"==type(obj) && obj['$ref']);
}

});
require.register("component-indexof/index.js", function(exports, require, module){
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("ericgj-json-schema-valid/index.js", function(exports, require, module){
'use strict';

var isBrowser = require('is-browser')
  , validate = require('./validate')
  , Context = require('./context')
  , core = isBrowser ? require('json-schema-core') : require('json-schema-core-component')
  , Schema = core.Schema
  , each = isBrowser ? require('each') : require('each-component')
  , type = isBrowser ? require('type') : require('component-type')

var validateObject = require('./type/object')
  , validateArray = require('./type/array')
  , validateString = require('./type/string')
  , validateNumeric = require('./type/numeric')
  , validateEnum = require('./type/enum')

var formatRegex = require('./format/regex')

/* custom formats are not loaded by default
  , formatjsFunc = require('./format/js-function')
  , formatNonBlank = require('./format/non-blank')
*/

// default validate() configuration

validate.addType('object',validateObject);
validate.addType('array',validateArray);
validate.addType('string',validateString);
validate.addType('numeric',validateNumeric);
validate.addType('enum',validateEnum);

validate.addFormat('date',/^(\d{4})((\-?)(0\d|1[0-2]))((\-?)([0-2]\d|3[0-1]))$/);
validate.addFormat('time',/^([01]\d|2[0-3])((:?)[0-5]\d)((:?)[0-5]\d)$/);
validate.addFormat('datetime',/^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/);
validate.addFormat('utc',/^\d+$/);
validate.addFormat('regex',formatRegex);
validate.addFormat('email',/^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i);
validate.addFormat('phone',/^[0-9\(\)\.\-\s]+$/);
validate.addFormat('uri',/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);

/* custom formats are not loaded by default
validate.addFormat('js-function',formatjsFunc);
validate.addFormat('non-blank',formatNonBlank);
*/

// late-bind validate to Context.prototype here
// to include all custom type/format functions

Context.prototype.validate = validate;


module.exports = Validator;

function Validator(fn){

  if (type(fn) == 'function'){  // plugin, fn == Schema
    plugin(fn);

  } else {   // standalone validator
    if (!(this instanceof Validator)) return new Validator();
    return this;

  }
}

Validator.addFormat = function(key,fn){
  validate.addFormat(key,fn);
  return this;
}

Validator.addType = function(key,fn){
  validate.addType(key,fn);
  return this;
}

Validator.prototype.context = function(){
  return this._ctx;
}

Validator.prototype.valid = function(){
  var ctx = this.context()
  return ctx && ctx.valid();
}

Validator.prototype.error = function(){
  var ctx = this.context()
  return ctx && ctx.error();
}

Validator.prototype.errorTrace = function(){
  var ctx = this.context()
  return ctx && ctx.errorTrace();
}

Validator.prototype.assertionTrace = function(){
  var ctx = this.context()
  return ctx && ctx.assertionTrace();
}

Validator.prototype.errorTree = function(){
  var ctx = this.context()
  return ctx && ctx.errorTree();
}

Validator.prototype.assertionTree = function(){
  var ctx = this.context()
  return ctx && ctx.assertionTree();
}

/******************************** 
 * Standalone validate()
 *
 */
Validator.prototype.validate = function(schema,instance,fn){
  if (!schema) return;
  var ctx = new Context(schema,instance);
  this._ctx = ctx;
  return ctx.validate(fn);
}

Validator.prototype.validateRaw = function(schema,instance,fn){
  schema = new Schema().parse(schema);
  return this.validate(schema,instance,fn);
}


/******************************** 
 * Schema plugin
 *
 * - Adds validate() to correlation
 * - Wraps existing correlation methods to account for validation 
 *   (i.e., when multiple schemas apply).
 *   - Adds resolveLinks() to correlation, used as basis for 
 *     correlation.links() defined in json-schema-hyper plugin.
 *   - Wraps subschema() 
 *   - Wraps coerce()
 *
 */
function plugin(target){
  target.addBinding('validate',validateBinding);
  target.addBinding('resolveLinks',resolveLinksBinding);
  target.addBinding('subschema',subschemaBinding);
  target.addBinding('coerce',coerceBinding);
}


/*
 * correlation.validate()
 *
 * Validates correlation instance against correlation schema.
 *
 * Note validation errors are inaccessible here; if you need
 * them, use the standalone validate().
 *
 * @returns boolean
 *
 */
function validateBinding(fn){
  if (!this.schema || this.instance === undefined) return;
  var validator = new Validator()
    , valid =  validator.validate(this.schema,this.instance,fn);
  if (!valid){
    this.emit('error', validator.error())
  }
  return (valid);
}

/*
 * correlation.resolveLinks()
 *
 * Validates, and builds a links object, concatenating all link
 * specifications from all valid schemas. Links are then resolved
 * against the correlation instance.
 *
 * Typically this method is not called directly but instead via
 * correlation.links(), defined in json-schema-hyper.
 *
 * @returns new Links
 *
 */
function resolveLinksBinding(){
  if (!this.schema || this.instance === undefined) return;
  var links;
  var valid = this.validate( function(schemas){
    links = mergeLinks(schemas);
  })
  if (!valid) return;
  return links && links.resolve(this.instance);
}

/*
 * correlation.subschema()
 *
 * Validates, and builds a 'collated' schema (Schema.allOf) for the given
 * property/array-index from all valid schemas. Note if only one valid 
 * schema (the "top-level schema"), the behavior is identical to the basic 
 * subschema() method provided in json-schema-core.
 *
 * @returns schema
 *
 */
function subschemaBinding(prop){
  if (!this.schema || this.instance === undefined) return;
  var self = this
    , ret
  this.validate( function(schemas){
    ret = buildSubschema.call(self,schemas,prop);
  });
  return ret;
}

/*
 * correlation.coerce()
 *
 * Validates, and coerces instance according to:
 * (1) the first valid schema that specifies either `type` or `default` or both;
 * (2) the "top-level schema", otherwise, whether instance is valid or invalid.
 *
 * Note that the ordering of valid schemas cannot be relied on, so it is
 * recommended that either the top-level schema specify type and/or default, or
 * _only one_ combination schema specify these.
 *
 * @returns new Correlation
 *
 */
function coerceBinding(){
  if (!this.schema || this.instance === undefined) return;
  var self = this
    , ret
  var valid = this.validate( function(schemas){
    ret = buildCoerce.call(self,schemas);
  });
  if (!valid) ret = buildCoerce.call(self,[this.schema]);
  return ret;
}


// private

function buildSubschema(schemas,prop){
  var protoSubschema = this.__proto__.subschema
    , instance = this.instance
    , found = []
  each(schemas, function(schema){
    var corr = schema.bind(instance)
      , sub = protoSubschema.call(corr,prop)
    if (sub) found.push(sub);
  })
  if (found.length == 0){
    return (new Schema());  // if property in instance but not any valid schema
  } else if (found.length == 1){
    return (found[0]);
  } else {
    return (Schema.allOf(found));
  }
}


function buildCoerce(schemas){
  var protoCoerce = this.__proto__.coerce
    , instance = this.instance
    , ret
  for (var i=0;i<schemas.length;++i){
    var schema = schemas[i]
      , corr = schema.bind(instance)

    // coerce against first schema
    if (!ret) ret = protoCoerce.call(corr);

    // and overwrite with first schema that has either type or default specified
    // if any
    if (( schema.hasProperty('type') || 
          schema.hasProperty('default') )) {
      ret = protoCoerce.call(corr)
      break;  
    }
  }
  return ret;
}


// utils

function mergeLinks(schemas){
  schemas = type(schemas) == 'array' ? schemas : [schemas];
  var target = new Schema().parse({links: []});
  var targetLinks = target.get('links');
  each(schemas, function(schema){
    var links = schema.get('links')
    if (links){
      links.each( function(i,link){
        targetLinks.set(link);
      });
    }
  })
  return targetLinks;
}


});
require.register("ericgj-json-schema-valid/validate.js", function(exports, require, module){
'use strict';

var isBrowser = require('is-browser')
  , indexOf = isBrowser ? require('indexof') : require('indexof-component')
  , type = isBrowser ? require('type') : require('component-type')

module.exports = validate;

function validate(fn){
  validateType.call(this);
  validateTypes.call(this);
  validateFormat.call(this);
  validateCombinations.call(this, fn);

  return (this.valid());
}

validate._types = {};
validate._formats = {};

validate.addType = function(key,fn){
  validate._types[key] = fn;
  return this;
}

validate.addFormat = function(key,fn){
  if (type(fn)=="regexp"){
    var r = fn; 
    fn = function(){ 
      var val = this.instance();
      if (val == undefined) return false;
      return !!r.test(val.toString()); 
    };
  }
  validate._formats[key] = fn;
  return this;
}

validate.getTypes = function(){ return this._types; }
validate.getFormat = function(key){ return this._formats[key]; }


function validateType(){
  var types = this.property('type')
    , instance = this.instance()
    , actual = type(instance)
    , isinteger = actual == 'number' && (instance==(instance|0))
  if (!types) return;
  if (instance === undefined) return;

  types = ('array' == type(types) ? types : [types])
  var valid = (indexOf(types,actual)>=0) || 
                (isinteger && indexOf(types,'integer')>=0)
    , isnull = (actual == 'null')
  this.assert( valid, 
              isnull ? "is missing" : "does not match type",
              "type",
              actual
             );
}

// Note: assertions done in concrete validator functions
function validateTypes(){
  var types = validate.getTypes()
  for (var k in types){
    var validator = types[k]
    validator.call(this);
  }
}

function validateFormat(){
  var format = this.property('format')
    , instance = this.instance()
  if (!format) return;
  if (instance === undefined) return;

  var formatter = validate.getFormat(format)
  if (!formatter) return; 
  
  this.assert( formatter.call(this),
              'does not match format',
              'format'
             );
}

function validateCombinations(fn){

  var allOf = this.get('allOf')
    , anyOf = this.get('anyOf')
    , oneOf = this.get('oneOf')
    , not   = this.get('not')
 
  var valids = [this.schema()]
  var collect = function(schemas){
    valids.push.apply(valids,schemas);
  }

  if (allOf){
    this.assert( validateAllOf.call(this,collect),
                 "not all of conditions valid",
                 "allOf"
               );
  }
  if (anyOf){
    this.assert( validateAnyOf.call(this,collect),
                 "not any of conditions valid",
                 "anyOf"
               );
  }
  if (oneOf){
    this.assert( validateOneOf.call(this,collect),
                 "not any of conditions valid, or more than one of conditions valid",
                 "oneOf"
               );
  }
  if (not){
    this.assert( validateNot.call(this),
                 "not condition invalid",
                 "not"
               );
  }

  if (this.valid() && fn) fn(valids);
}


/*************
 * Combinations 
 *
 */

function validateAllOf(fn){
  var validfn = function(ctx,valid,collect){ 
    validate.call(ctx,collect);
    return (ctx.valid() && valid);
  }
  return validateCombination.call(this,'allOf',true,validfn,fn);
}

function validateAnyOf(fn){
  var validfn = function(ctx,valid,collect){ 
    validate.call(ctx,collect);
    return (ctx.valid() || valid);
  }
  return validateCombination.call(this,'anyOf',false,validfn,fn);
}

function validateOneOf(fn){
  var validfn = function(ctx,valid,collect){ 
    validate.call(ctx,collect);
    return (ctx.valid() ? !valid : valid);
  }
  return validateCombination.call(this,'oneOf',false,validfn,fn);
}

function validateNot(){
  var ctx = this.subcontext('not')
    , not = ctx.schema
  if (!not) return;
  validate.call(ctx) 
  return (!ctx.valid());
}

function validateCombination(key,valid,validfn,fn){
  var cond = this.get(key);
  if (!cond) return;

  var valids = []
  var collect = function(schemas){
    valids.push.apply(valids,schemas);
  }

  var self = this
  cond.each( function(i,schema){
    var ctx = self.subcontext([key,i].join('/'))
    valid = validfn(ctx,valid,collect);
  });
  
  if (valid && fn && valids.length > 0) fn(valids);

  return (valid);
}



});
require.register("ericgj-json-schema-valid/context.js", function(exports, require, module){
'use strict';

var has = hasOwnProperty

module.exports = Context;

function Context(schema,instance,schemaPath,instancePath){
  this._schema = schema; this._instance = instance;
  this._schemaPath = schemaPath; this._instancePath = instancePath;
  this._asserts = [];
  this._ctxs = [];
  this._valid = true;
  return this;
}

Context.prototype.subcontext = function(schemaPath,instancePath){
  var schema = this.schema()
    , instance = this.instance()
    , subsch = (schemaPath == undefined) ? schema : schema.getPath(schemaPath)
    , subinst = (instancePath == undefined) ? instance : getPath(instance,instancePath)
    , subschPath = joinPath(this.schemaPath(),schemaPath)
    , subinstPath = joinPath(this.instancePath(),instancePath)
    , sub = new Context(subsch,subinst,subschPath,subinstPath)
  this._ctxs.push(sub);
  return sub;
}

Context.prototype.valid = function(){
  return this._valid;
}

Context.prototype.schema = function(){
  return this._schema;
}

Context.prototype.instance = function(){
  return this._instance;
}

Context.prototype.property = function(prop){
  var schema = this.schema()
  return schema && schema.property(prop);
}

Context.prototype.get = function(cond){
  var schema = this.schema()
  return schema && schema.get(cond);
}

Context.prototype.schemaPath = function(){
  return this._schemaPath;
}

Context.prototype.instancePath = function(){
  return this._instancePath;
}

Context.prototype.assert = function(value, message, prop, actual){
  var assert = new Assertion(this,value)
  if (actual !== undefined) assert.actual(actual);
  if (prop !== undefined) assert.property(prop);
  if (!value && message !== undefined) assert.predicate(message);
  this._valid = value && this._valid;
  this._asserts.push(assert);
  return this._valid;
}

Context.prototype.assertions = function(){
  return this._asserts;
}

Context.prototype.subcontexts = function(){
  return this._ctxs;
}

Context.prototype.assertionTree = function(){
  return new AssertionTree(this);
}

Context.prototype.error = function(){
  var tree = this.errorTree()
  return tree && tree.toError();
}

Context.prototype.errorTree = function(){
  if (this.valid()) return;
  return this.assertionTree().errorTree();
}

Context.prototype.assertionTrace = function(){
  return this.assertionTree().trace();
}

Context.prototype.errorTrace = function(){
  var tree = this.errorTree()
  return tree && tree.trace();
}


function AssertionTree(context){
  if (!(this instanceof AssertionTree)) return new AssertionTree();
  this._assertions = [];
  this._branches = [];
  this._valid = undefined;
  if (context) this.parse(context);
  return this;
}

AssertionTree.prototype.valid = function(){
  return this._valid;
}

AssertionTree.prototype.assertions = function(){
  return this._assertions;
}

AssertionTree.prototype.branches = function(){
  return this._branches;
}

AssertionTree.prototype.setValid = function(value){
  this._valid = value;
}

AssertionTree.prototype.addAssertion = function(assertion){
  this._assertions.push(assertion);
  return this;
}

AssertionTree.prototype.addBranch = function(tree){
  this._branches.push(tree);
  return this;
}

AssertionTree.prototype.errorTree = function(){
  return this.select(
    function(tree){ return !tree.valid() },
    function(a)   { return !(a.valid || a.contextValid); }
  );
}

AssertionTree.prototype.toError = function(){
  var tree = this.errorTree()
  if (!tree) return;
  var msgs = tree.trace()
  if (msgs.length == 0) return;
  var err = new Error(msgs[0]);
  err.trace = msgs;
  err.tree = tree;
  return err;
}

AssertionTree.prototype.parse = function(ctx){
  this._valid = ctx.valid();
  var asserts = ctx.assertions()
    , ctxs = ctx.subcontexts()
  for (var i=0;i<asserts.length;++i){
    var assert = asserts[i].toObject()
    this.addAssertion(assert);
  }
  for (var i=0;i<ctxs.length;++i){
    var tree = new AssertionTree(ctxs[i])
    this.addBranch(tree);
  }
  return this;
}

AssertionTree.prototype.select = function(branchfn,assertfn){
  if (branchfn && !branchfn(this)) return;
  var ret = new AssertionTree();
  ret.setValid(this.valid());
  var asserts = this.assertions()
    , branches = this.branches()
  for (var i=0;i<asserts.length;++i){
    var assert = asserts[i]
    if (!assertfn || assertfn(assert)) ret.addAssertion(assert);
  }
  for (var i=0;i<branches.length;++i){
    var tree = branches[i]
      , filtered = tree.select(branchfn,assertfn);
    if (filtered) ret.addBranch(filtered);
  }
  return ret;
}

AssertionTree.prototype.trace = function(accum,level){
  accum = accum || [];
  level = level || 0;
  var asserts = this.assertions()
    , branches = this.branches()
  for (var i=0;i<asserts.length;++i){
    accum.push( repeatString(' ', level * 2) + asserts[i].message );
  }
  level++;
  for (var i=0;i<branches.length;++i){
    var tree = branches[i]
    tree.trace(accum,level);
  }
  level--;
  return accum;
}




function Assertion(ctx,valid){
  if (!(this instanceof Assertion)) return new Assertion(ctx,valid);
  this._ctx = ctx;
  this._valid = valid;
  return this;
}

Assertion.prototype.valid = function(){
  return this._valid;
}

Assertion.prototype.contextValid = function(){
  return this.context().valid();
}

Assertion.prototype.context = function(){
  return this._ctx;
}

Assertion.prototype.predicate = function(m){
  if (arguments.length == 0){  return this._predicate; }
  else { this._predicate = m; return this; }
}

Assertion.prototype.actual = function(v){
  if (arguments.length == 0){  
    return this._actual || this.context().instance();
  }
  else { this._actual = v; return this; }
}

Assertion.prototype.property = function(p){
  if (arguments.length == 0){  return this._property; }
  else { this._property = p; return this; }
}

Assertion.prototype.expected = function(){
  var prop = this.property()
    , schema = this.context().schema()
  return prop && schema && schema.property(prop);
}

// for convenience
Assertion.prototype.message = function(){
  var context = this.context()
    , prop = this.property()
    , valid = this.valid()
    , expected = this.expected()
    , actual = this.actual()
    , predicate = this.predicate()
    , instPath = context.instancePath()
  var ret = []
  if (instPath !== undefined) ret.push(instPath);
  if (prop !== undefined) ret.push(prop);
  ret.push( valid ? "valid" : "invalid" )
  if (predicate !== undefined){
    ret.push(":");
    ret.push(predicate);
  }
  if (!valid && expected !== undefined){ 
    ret.push(":");
    ret.push( "expected " + JSON.stringify(expected) + 
              ", was " + JSON.stringify(actual)
            );
  }
  return ret.join(' ');
}

Assertion.prototype.toObject = function(){
  var ret = {}
    , context = this.context()
    , path = context.schemaPath()
    , prop = this.property()
  ret.contextValid = this.contextValid();
  ret.valid = this.valid();
  ret.predicate = this.predicate();
  ret.message = this.message();
  ret.schemaPath = path;
  ret.schemaProperty = prop;
  ret.schemaValue = this.expected();
  ret.schemaKey = joinPath(path,prop);
  ret.instancePath = context.instancePath();
  ret.instanceValue = context.instance();
  ret.expected = this.expected();
  ret.actual = this.actual();

  return ret;
}

// private

// utils

function joinPath(p1,p2){
  if (p1 == undefined && p2 == undefined) return;
  var segments = []; 
  if (p1 !== undefined) segments.push.apply(segments,p1.toString().split('/'));
  if (p2 !== undefined) segments.push.apply(segments,p2.toString().split('/'));
  return segments.join('/');
}

function getPath(instance,path){
  if (path === undefined) return instance;
  path = path.toString();
  if (0==path.length) return instance;
  var parts = path.split('/')
    , prop = parts.shift()
    , rest = parts.join('/')
  if ('#'==prop) return getPath(instance,rest);
  if (!has.call(instance,prop)) return;
  var branch = instance[prop]
  return getPath(branch,rest);
}

function repeatString(str,times){
  if (str.repeat) return str.repeat(times);
  var r = ''
  for (var i=0;i<times;++i){
    r = r + str;
  }
  return r;
}


});
require.register("ericgj-json-schema-valid/deepequal.js", function(exports, require, module){

/* 
 * Copied from sinon.js, minus the Element equality checking not needed here.
 * http://github.com/cjohansen/Sinon.JS
 * (BSD License -- see below)
 *
 */
module.exports = function deepEqual(a, b) {

  if (typeof a != "object" || typeof b != "object") {
      return a === b;
  }

  if (a === b) {
      return true;
  }

  if ((a === null && b !== null) || (a !== null && b === null)) {
      return false;
  }

  var aString = Object.prototype.toString.call(a);
  if (aString != Object.prototype.toString.call(b)) {
      return false;
  }

  if (aString == "[object Array]") {
      if (a.length !== b.length) {
          return false;
      }

      for (var i = 0, l = a.length; i < l; i += 1) {
          if (!deepEqual(a[i], b[i])) {
              return false;
          }
      }

      return true;
  }

  var prop, aLength = 0, bLength = 0;

  for (prop in a) {
      aLength += 1;

      if (!deepEqual(a[prop], b[prop])) {
          return false;
      }
  }

  for (prop in b) {
      bLength += 1;
  }

  return aLength == bLength;
}

/*

(The BSD License)

Copyright (c) 2010-2013, Christian Johansen, christian@cjohansen.no
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.
    * Neither the name of Christian Johansen nor the names of his contributors
      may be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

});
require.register("ericgj-json-schema-valid/type/object.js", function(exports, require, module){
'use strict';

var isBrowser = require('is-browser')
  , type = isBrowser ? require('type') : require('component-type')
  , has = hasOwnProperty

module.exports = validateObject;

function validateObject(){
  if (type(this.instance())!=='object') return;
  validateObjectMinMax.call(this);
  validateObjectRequired.call(this);
  validateObjectProperties.call(this);
  validateObjectDependencies.call(this);
}

function validateObjectMinMax(){
  var min = this.property('minProperties')
    , max = this.property('maxProperties')
    , keys = objectKeys(this.instance())

  if (min){
    this.assert(keys.length >= min, 
                "too few properties",
                "minProperties",
                keys.length
               );
  }

  if (max){
    this.assert(keys.length <= max, 
                "too many properties",
                "maxProperties",
                keys.length
               );
  }
}

function validateObjectRequired(){
  var reqs = this.property('required') || []
    , instance = this.instance()
    , keys = objectKeys(instance)

  for (var i=0;i<reqs.length;++i){
    this.assert(!!has.call(instance,reqs[i]), 
                "missing required property",
                "required",
                keys
               );
  }
}

function validateObjectProperties(){
  var count = 0
    , self = this
    , additional = this.property('additionalProperties')
    , additionalSchema = this.get('additionalProperties')

  var validatePropContext = function(ctx,prop){
    count++;
    self.assert(ctx.validate(),
                'property "'+ prop + '" is not valid'
               );
  }

  for (var key in this.instance()){
    
    count = 0;
    withPropertyContext.call(this,key,validatePropContext);
    withPatternPropertyContexts.call(this,key,validatePropContext);

    // if no property or patternProperty schema for key
    if (count == 0) {
      if ('boolean' == type(additional)) {
        this.assert(additional, 
                    'unknown property',
                    'additional',
                    key
                   );
      }
      if (additionalSchema){
        var ctx = this.subcontext('additionalProperties',key)
        this.assert( ctx.validate(),
                     'an additional property is invalid',
                     'additionalProperties'
                   );
      }
    }
  }
}


function validateObjectDependencies(){
  var deps = this.get('dependencies')
    , instance = this.instance()
  if (!deps) return; 
  var self = this
  deps.each( function(key,dep){
    if (!has.call(instance,key)) return;
    if (type(dep)=='array'){
      var missing = []
      for (var i=0;i<dep.length;++i){
        if (!has.call(instance,dep[i])) missing.push(dep[i]);
      }
      self.assert(missing.length == 0,
                  "has missing dependencies " + JSON.stringify(missing),
                  ["dependencies",key].join('/')
                 );
    } else if (dep.nodeType == 'Schema'){
      var ctx = self.subcontext(['dependencies',key].join('/'))
      self.assert( ctx.validate(),
                   "has invalid dependency"
                 );
    }
  })
}

// private

function withPropertyContext(key,fn){
  var props = this.get('properties')
    , prop = props && props.get(key)
  if (!prop) return;
  var ctx = this.subcontext(['properties',key].join('/'),key);
  fn(ctx,key);
}

function withPatternPropertyContexts(key,fn){
  var props = this.get('patternProperties')
  if (!props) return;
  var self = this;
  props.each( function(rx,schema){
    var matcher = new RegExp(rx);
    if (matcher.test(key)){
      var ctx = self.subcontext(['patternProperties',rx].join('/'),key);
      fn(ctx,key);
    }
  });
}

// utils

var objectKeys = Object.keys || function(obj){
  var ks = []
  for (var k in obj) ks.push(k);
  return ks;
}


});
require.register("ericgj-json-schema-valid/type/array.js", function(exports, require, module){
'use strict';

var isBrowser = require('is-browser')
  , type = isBrowser ? require('type') : require('component-type')
  , deepEqual = require('../deepequal')

module.exports = validateArray;

function validateArray(){
  if (type(this.instance())!=='array') return;
  validateArrayLength.call(this);
  validateArrayUniqueItems.call(this);
  validateArrayItems.call(this);
}

function validateArrayLength(){
  var min = this.property('minItems')
    , max = this.property('maxItems')
    , instance = this.instance()

  if (min){
    this.assert(instance.length >= min,
                "has less than the minimum number of items",
                "minItems",
                instance.length
               );
  }
  if (max){
    this.assert(instance.length <= max,
                "has greater than the maximum number of items",
                "maxItems",
                instance.length
               );
  }
}

function validateArrayUniqueItems(){
  var unique = this.property('uniqueItems')
    , instance = this.instance()
    , match = false

  if (!unique) return;

  for (var i=0;i<instance.length;++i){
    for (var j=i+1;j<instance.length;++j){
      match = deepEqual(instance[i],instance[j]);
      if (match) break;
    }
    if (match) break;
  }
  this.assert(!match,
              "does not contain unique items",
              "uniqueItems"
             );
}

function validateArrayItems(){
  var items = this.get('items')
    , additional = this.property('additionalItems')
    , additionalSchema = this.get('additionalItems')
    , instance = this.instance()
  if (!items) return;
  if (items.nodeType == 'SchemaArray'){
    for (var i=0;i<instance.length;++i){
      var schema = items.get(i)
      if (schema){
        var ctx = this.subcontext(['items',i].join('/'),i)
        this.assert( ctx.validate(),
                     "item " + i + " is invalid",
                     "items"
                   );
      } else if (type(additional)=='boolean') {
        this.assert(additional,
                    "contains additional items",
                    "additionalItems",
                    true
                   );
      } else if (additionalSchema){
        var ctx = this.subcontext('additionalItems',i)
        this.assert( ctx.validate(),
                     "additional item " + i + " is invalid",
                     "additionalSchema"
                   );
      }
    }
  } else if (items.nodeType == 'Schema') {
     for (var i=0;i<instance.length;++i){
       var ctx = this.subcontext('items',i)
       this.assert( ctx.validate(),
                    "item " + i + " is invalid",
                    "items"
                  );
     }
  }
}




});
require.register("ericgj-json-schema-valid/type/string.js", function(exports, require, module){
'use strict';

var isBrowser = require('is-browser')
  , type = isBrowser ? require('type') : require('component-type')

module.exports = ValidateString;

function ValidateString(){
  if (type(this.instance())!=='string') return;
  validateStringLength.call(this)
  validateStringPattern.call(this)
}

function validateStringLength() {
  var instance = this.instance()
    , min = this.property('minLength')
    , max = this.property('maxLength')

  if (min){
    this.assert(instance.length >= min, 
                "is less than the minimum length",
                "minLength",
                instance.length
               );
  }
  if (max){
    this.assert(instance.length <= max,
                "is greater than the maximum length",
                "maxLength",
                instance.length
               );
  }
}

function validateStringPattern(){
  var pattern = this.property('pattern')
  if (!pattern) return;
  pattern = new RegExp(pattern);
  this.assert(pattern.test(this.instance()), 
             "did not match pattern",
             "pattern"
            );
}


});
require.register("ericgj-json-schema-valid/type/numeric.js", function(exports, require, module){
'use strict';

var isBrowser = require('is-browser')
  , type = isBrowser ? require('type') : require('component-type')

module.exports = validateNumeric;

function validateNumeric(){
  if (type(this.instance())!=='number') return;
  validateMultipleOf.call(this);
  validateMinMax.call(this);
}

function validateMultipleOf(){
  var multipleOf = this.property('multipleOf')
    , instance = this.instance()
  if (!multipleOf) return;
  this.assert((instance/multipleOf % 1) == 0, 
              "not a multiple of",
              "multipleOf"
             );
}

function validateMinMax(){
  var min = this.property('minimum'), minExcl = this.property('exclusiveMinimum')
    , max = this.property('maximum'), maxExcl = this.property('exclusiveMaximum')
    , instance = this.instance()
  
  if (min){
    this.assert(instance >= min, 
                "less than minimum",
                "minimum"
               )
    if (minExcl){
      this.assert(instance > min, 
                  "not greater than exclusive minimum",
                  "exclusiveMinimum"
                 )
    }
  }

  if (max){
    this.assert(instance <= max, 
                "greater than maximum",
                "maximum"
               )
    if (maxExcl){
      this.assert(instance < max, 
                  "not less than exclusive maximum",
                  "exclusiveMaximum"
                 )
    }
  }
}


});
require.register("ericgj-json-schema-valid/type/enum.js", function(exports, require, module){
'use strict';

var isBrowser = require('is-browser')
  , type = isBrowser ? require('type') : require('component-type')
  , deepEqual = require('../deepequal')

module.exports = validateEnum;

function validateEnum(){
  var values = this.property('enum')
    , instance = this.instance()

  if (!values) return;

  var isarr = type(values)=='array';
  this.assert(isarr,
              "specified enum is not an array"
             );
  if (!isarr) return;

  var found = false;
  for (var i=0;i<values.length;++i){
    if (deepEqual(values[i],instance)){ found = true; break; }
  }
  this.assert(found, 
              "not a valid value", 
              "enum"
             );
}


});
require.register("ericgj-json-schema-valid/format/regex.js", function(exports, require, module){
'use strict';

module.exports = function(){

  var instance = this.instance()
    , instance = instance.toString()

  try      { new RegExp(instance); } 
  catch(e) { return false; }

  return true;
}


});
require.register("ericgj-json-schema-valid/format/js-function.js", function(exports, require, module){
'use strict';

var toFunc = require('to-function')

module.exports = function(){

  var instance = this.instance()
    , strfn = this.property('js-function')

  if (strfn === undefined) return;
  
  var fn = toFunc(strfn)
    , ret, msg

  try      { ret = fn(instance); }
  catch(e) { ret = false; msg = e.message; }

  this.assert( ret,
               'does not meet condition "' + strfn + '"' + 
                 (msg ? " ; " + msg : "")
             );

  return (!!ret);
}


});
require.register("ericgj-json-schema-valid/format/non-blank.js", function(exports, require, module){
'use strict';

module.exports = function(){

  var instance = this.instance()
    , ret = ( instance !== undefined && instance !== null && instance !== '' )
  this.assert( ret,
               'missing'
             );

  return (!!ret);
}


});
require.register("ericgj-json-schema-agent/index.js", function(exports, require, module){
'use strict';

var isBrowser = require('is-browser')
  , core = isBrowser ? require('json-schema-core') : require('json-schema-core-component')
  , hyper = isBrowser ? require('json-schema-hyper') : require('json-schema-hyper-component')
  , Uri = isBrowser ? require('json-schema-uri') : require('json-schema-uri-component')
  , getLinkHeaderHrefs = require('./linkheader')
  , deref = require('./deref')
  
var Correlation = core.Correlation
  , Schema = core.Schema
  , Document = core.Document


module.exports = Agent;

function Agent(cache){
  if (!(this instanceof Agent)) return new Agent(cache);
  this._cache = cache || new Cache;
  return this;
}

Schema.use(hyper);
Agent.Schema = Schema;

Agent.service = function(klass){ 
  if (arguments.length > 0) { this.Service = klass; }
  else { return this.Service; }
}
 
function Cache(){
  this._cache = {};
}
Cache.prototype.get = function(uri){ return this._cache[uri]; }
Cache.prototype.set = function(uri,obj){ this._cache[uri] = obj; }



Agent.prototype.base = function(base){
  if (arguments.length > 0) { this._base = base; }
  else { return this._base }
}

Agent.prototype.get = function(link,obj,fn){
  follow.call(this,'get',link,obj,fn);
}

Agent.prototype.head = function(link,obj,fn){
  follow.call(this,'head',link,obj,fn);
}

Agent.prototype.put = function(link,obj,fn){
  follow.call(this,'put',link,obj,fn);
}

Agent.prototype.post = function(link,obj,fn){
  follow.call(this,'post',link,obj,fn);
}

Agent.prototype.patch = function(link,obj,fn){
  follow.call(this,'patch',link,obj,fn);
}

Agent.prototype.del = function(link,fn){
  follow.call(this,'del',link,undefined,fn);
}

/*
 * Follow link based on method property
 */
Agent.prototype.follow = function(link,obj,fn){
  link = linkAttributes(link);
  var meth = (link.method || 'GET').toLowerCase();
  if (meth == 'delete') meth = 'del';

  var agent = this
  follow.call(this,meth,link,obj,fn);
}


/* 
 * Note public method, but rarely called from client code.  Yields a
 * schema object or fragment, dereferenced, from cache if present.
 * 
 * Called by `follow` callback to fetch schemas for instance URIs 
 * (`wrapCorrelate`), however it itself is a wrapper around `follow` in 
 * relation to _schema_ URIs.
 */
Agent.prototype.getSchema =
Agent.prototype.getCache = function(uri, fn, crumb){
  var agent = this
    , schemaUri = Uri(this.base()).join(uri)
    , base = schemaUri.base()
    , fragment = schemaUri.fragment()
    , schema = agent._cache.get(base)
  
  crumb = crumb || []; // processed uris

  // cache hit
  if (schema){
    if (fragment) schema = schema.$(fragment);
    fn(undefined,schema);

  // cache miss
  } else {
    follow.call(agent, 'get', base, function(err,corr){
      if (err){ fn(err); return; }
      var obj = corr.instance;
      obj.id = obj.id || base;
      
      crumb.push(obj.id);  // processed, but not yet dereferenced

      agent.dereference(obj,function(err,schema){
        if (err){ fn(err); return; }
        agent._cache.set(base,schema);
        if (fragment) schema = schema.$(fragment);
        fn(undefined,schema);
      }, crumb);

    })
  }
}

/*
 * Dereference raw schema object, yielding built schema
 */
Agent.prototype.dereference = function(obj,fn,crumb){
  var schema = new Schema().parse(obj);
  deref(this,schema, function(err){
    fn(err,schema);
  }, crumb);
}

// private 

/* 
 * Builds request from link, runs schema validation, and yields a _correlated 
 * instance_ (instance + schemas), first running targetSchema validation on it.
 * This is the JSON Hyper-Schema wrapper around the http request/response.
 */
function follow(meth,link,obj,fn){
  var agent = this;
   
   // parameter normalization
  if ('function' == typeof obj){
    fn = obj; obj = undefined;
  }
  link = linkAttributes(link);
 
  // input schema validation
  var err = validate(link.schema,obj);
  if (err){ fn(err); return; }
 
  // build request
  var request = Agent.Service();

  if (!request[meth]){
    var err = new Error("Unknown method: '" + meth + "'");
    fn(err); return;
  }

  var uri     = Uri(this.base()).join(link.href)
    , baseuri = uri.base()
    , fragment = uri.fragment()
    , accept  = link.mediaType
    , encType = link.encType

  encType = encType || (link.method == 'POST' ? 
                          'application/json' : 
                          undefined
                       );

  if (accept)  request.set('Accept', accept);
  if (encType) request.set('Content-Type', encType);
    
  var wrap = function(err,res){
    if (err){ fn(err); return; }
    if (res.error) { fn(res.error); return; }
    wrapCorrelate.call(agent,res,link.targetSchema,fn); 
  }

  // send request
  if (obj){
    request[meth](baseuri, obj, wrap);
  } else {
    request[meth](baseuri, wrap);
  }
 
}


function wrapCorrelate(res,targetSchema,fn){
  var agent = this
    , instance = res.body
  var schemaUris = getSchemaURIs(res);

  // no schemas specified, use blank
  if (!schemaUris || schemaUris.length == 0){
    var schema = new Schema().parse({});
    fn.apply(
      undefined,
      buildCorrelate(schema,instance,targetSchema)
    );
  
  // load each schema specified and build union schema
  } else {
    correlateSchemas.call(agent,schemaUris,instance,targetSchema,fn);
  }
}

function correlateSchemas(uris,instance,targetSchema,fn){
  var agent = this
    , schemas = []

  while (uris.length) {
    var uri = uris.shift()
    
    agent.getCache(uri, function(err,schema){
      if (err){ fn(err); return; }  // note does not stop correlating next schema
      schemas.push(schema);

      // last schema, union and build correlation
      if (uris.length == 0){
        var union = schemas[0];
        if (schemas.length > 1) union = Schema.union(schemas);
        fn.apply(
          undefined,
          buildCorrelate(union,instance,targetSchema)
        );
      }

    });
  }
}

// utils

function linkAttributes(link){
  if ("string" == typeof link){
    return {href: link};
  } else if (link.nodeType && link.nodeType == "Link"){
    return link.attributes();
  }
  return link;
}

// note returns error if not valid, undefined otherwise
function validate(schema,obj){
  if (obj === undefined || !schema) return;
  var corr = schema.bind(obj)
  if (!corr.validate) return;
  var ret
  corr.once('error', function(err){ 
    ret = err; 
  });
  corr.validate();
  return ret;
}

function buildCorrelate(schema,instance,targetSchema){
  var corr = schema.bind(instance);
  var err = validate(targetSchema,instance);
  if (err) return [err,corr];
  return [undefined, corr];
}

function getSchemaURIs(res){
  var profile = getContentTypeProfile(res) 
  return profile ? [profile] 
                 : getDescribedByLinks(res);
}

function getContentTypeProfile(res){
  if (res.profile) {
    return res.profile;  // content-type params automatically set
  } else {
    // manual parse content-type params
    var ct = res.header['content-type'] || res.header['Content-Type'];
    if (ct) return params(ct).profile;
    return undefined;
  }
}

function getDescribedByLinks(res){
  var raw = res.header['link'] || res.header['Link'];
  if (!raw) return [];
  return getLinkHeaderHrefs(raw,'describedBy');
}


// taken from visionmedia/superagent

function params(str){
  return reduce(str.split(/ *; */), function(obj,str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
}

// inlined from RedVentures/reduce

function reduce(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};

});
require.register("ericgj-json-schema-agent/linkheader.js", function(exports, require, module){
'use strict';

/* Adapted from 
   http://bill.burkecentral.com/2009/10/15/parsing-link-headers-with-javascript-and-java/
   by Bill Burke
 */
 
var linkexp=/<[^>]*>\s*(\s*;\s*[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g;
var paramexp=/[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g;

module.exports = function(value,rel){
   var matches = value.match(linkexp);
   var ret = [];
   for (var i = 0; i < matches.length; i++)
   {
      var split = matches[i].split('>');
      var href = split[0].substring(1);
      var ps = split[1];
      var link = new Object();
      link.href = href;
      var s = ps.match(paramexp);
      for (var j = 0; j < s.length; j++)
      {
         var p = s[j];
         var paramsplit = p.split('=');
         var name = paramsplit[0];
         link[name] = unquote(paramsplit[1]);
      }

      if (link.rel && 
          link.rel.toLowerCase() == rel.toLowerCase()) ret.push(link.href);
   }
   return ret;
}

function unquote(value)
{
    if (value.charAt(0) == '"' && value.charAt(value.length - 1) == '"') return value.substring(1, value.length - 1);
    return value;
}


});
require.register("ericgj-json-schema-agent/deref.js", function(exports, require, module){
'use strict';

var isBrowser = require('is-browser')
  , Emitter = isBrowser ? require('emitter') : require('emitter-component')
  , Uri = isBrowser ? require('json-schema-uri') : require('json-schema-uri-component')

module.exports = Deref;

function Deref(agent,schema,fn,crumb){
  if (!(this instanceof Deref)) return new Deref(agent,schema,fn,crumb);
  this.agent = agent;
  this.crumb = crumb || [];
  if (schema) this.dereference(schema,fn);
  return this;
}

Deref.prototype = new Emitter();

Deref.prototype.dereference = function(schema,fn){

  schema = schema.root() || schema;
  var remotes = [];
  var self = this;
  var crumb = this.crumb;

  if (fn){ 
    this.once('ready',fn); 
    this.once('error',fn);
  }

  schema.eachRef( function(uri,node,key){
    inlineDereference(schema,uri,node,key) ||
      remotes.push([uri,node,key]);
  })
  
  if (remotes.length == 0) {
    self.emit('ready');
  } else {
    while (remotes.length){
      var args = remotes.shift()
      args.push(remotes.length == 0);
      args.push(crumb);
      asyncDereference.apply(self,args);
    }
  }
}

// private 

function inlineDereference(schema,uri,node,key){
  var ref = schema.$(uri)  // try inline dereference by URI or JSON pointer 
  if (ref) node.set(key,ref);
  return (!!ref);
}

function asyncDereference(uri,node,key,last,crumb){
  var self = this, agent = this.agent
    , baseUri = Uri(uri).base().toString()
  
  if (~indexOf(crumb,baseUri)) {
    var e = new Error('Cyclical references found: "' + uri + 
                      '" in ' + crumb[crumb.length-1]
                     );
    e.references = crumb;
    self.emit('error', e);
    return;
  }

  agent.getCache(uri, function(err,refnode){
    if (err){
      self.emit('error', err);
      return;
    }

    node.set(key,refnode);

    if (last) self.emit('ready');

  }, crumb )
}


// inlined

function indexOf(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};


});
require.register("RedVentures-reduce/index.js", function(exports, require, module){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
});
require.register("visionmedia-superagent/lib/client.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');

/**
 * Root reference for iframes.
 */

var root = 'undefined' == typeof window
  ? this
  : window;

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Determine XHR.
 */

function getXHR() {
  if (root.XMLHttpRequest
    && ('file:' != root.location.protocol || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
}

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(obj[key]));
    }
  }
  return pairs.join('&');
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  this.text = this.xhr.responseText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  return parse
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  var type = status / 100 | 0;

  // status / class
  this.status = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status || 1223 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var path = req.path;

  var msg = 'cannot ' + method + ' ' + path + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.path = path;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.on('end', function(){
    var res = new Response(self);
    if ('HEAD' == method) res.text = null;
    self.callback(null, res);
  });
}

/**
 * Mixin `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */

Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // querystring
 *       request.get('/search')
 *         .end(callback)
 *
 *       // multiple data "writes"
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"})
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  if (2 == fn.length) return fn(err, res);
  if (err) return this.emit('error', err);
  fn(res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;
    if (0 == xhr.status) {
      if (self.aborted) return self.timeoutError();
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  if (xhr.upload) {
    xhr.upload.onprogress = function(e){
      e.percent = e.loaded / e.total * 100;
      self.emit('progress', e);
    };
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var serialize = request.serialize[this.getHeader('Content-Type')];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  xhr.send(data);
  return this;
};

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.del = function(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

});
require.register("forbeslindesay-is-browser/client.js", function(exports, require, module){
module.exports = true;
});
require.register("json-schema-suite/index.js", function(exports, require, module){
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
  Validator: valid,
  HyperSchema: hyper
}


});
























require.alias("ericgj-json-schema-core/index.js", "json-schema-suite/deps/json-schema-core/index.js");
require.alias("ericgj-json-schema-core/refs.js", "json-schema-suite/deps/json-schema-core/refs.js");
require.alias("ericgj-json-schema-core/correlation.js", "json-schema-suite/deps/json-schema-core/correlation.js");
require.alias("ericgj-json-schema-core/index.js", "json-schema-suite/deps/json-schema-core/index.js");
require.alias("ericgj-json-schema-core/index.js", "json-schema-core/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-core/deps/json-schema-uri/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-core/deps/json-schema-uri/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-uri/index.js");
require.alias("component-each/index.js", "ericgj-json-schema-core/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-type/index.js", "ericgj-json-schema-core/deps/type/index.js");

require.alias("component-inherit/index.js", "ericgj-json-schema-core/deps/inherit/index.js");

require.alias("component-emitter/index.js", "ericgj-json-schema-core/deps/emitter/index.js");

require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-core/deps/is-browser/client.js");
require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-core/deps/is-browser/index.js");
require.alias("forbeslindesay-is-browser/client.js", "forbeslindesay-is-browser/index.js");
require.alias("ericgj-json-schema-core/index.js", "ericgj-json-schema-core/index.js");
require.alias("ericgj-json-schema-hyper/index.js", "json-schema-suite/deps/json-schema-hyper/index.js");
require.alias("ericgj-json-schema-hyper/index.js", "json-schema-suite/deps/json-schema-hyper/index.js");
require.alias("ericgj-json-schema-hyper/index.js", "json-schema-hyper/index.js");
require.alias("ericgj-json-schema-core/index.js", "ericgj-json-schema-hyper/deps/json-schema-core/index.js");
require.alias("ericgj-json-schema-core/refs.js", "ericgj-json-schema-hyper/deps/json-schema-core/refs.js");
require.alias("ericgj-json-schema-core/correlation.js", "ericgj-json-schema-hyper/deps/json-schema-core/correlation.js");
require.alias("ericgj-json-schema-core/index.js", "ericgj-json-schema-hyper/deps/json-schema-core/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-core/deps/json-schema-uri/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-core/deps/json-schema-uri/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-uri/index.js");
require.alias("component-each/index.js", "ericgj-json-schema-core/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-type/index.js", "ericgj-json-schema-core/deps/type/index.js");

require.alias("component-inherit/index.js", "ericgj-json-schema-core/deps/inherit/index.js");

require.alias("component-emitter/index.js", "ericgj-json-schema-core/deps/emitter/index.js");

require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-core/deps/is-browser/client.js");
require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-core/deps/is-browser/index.js");
require.alias("forbeslindesay-is-browser/client.js", "forbeslindesay-is-browser/index.js");
require.alias("ericgj-json-schema-core/index.js", "ericgj-json-schema-core/index.js");
require.alias("ericgj-uritemplate/bin/uritemplate.js", "ericgj-json-schema-hyper/deps/uritemplate/bin/uritemplate.js");
require.alias("ericgj-uritemplate/bin/uritemplate.js", "ericgj-json-schema-hyper/deps/uritemplate/index.js");
require.alias("ericgj-uritemplate/bin/uritemplate.js", "ericgj-uritemplate/index.js");
require.alias("component-inherit/index.js", "ericgj-json-schema-hyper/deps/inherit/index.js");

require.alias("component-each/index.js", "ericgj-json-schema-hyper/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-type/index.js", "ericgj-json-schema-hyper/deps/type/index.js");

require.alias("component-select/index.js", "ericgj-json-schema-hyper/deps/select/index.js");
require.alias("component-to-function/index.js", "component-select/deps/to-function/index.js");

require.alias("component-find/index.js", "ericgj-json-schema-hyper/deps/find/index.js");
require.alias("component-to-function/index.js", "component-find/deps/to-function/index.js");

require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-hyper/deps/is-browser/client.js");
require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-hyper/deps/is-browser/index.js");
require.alias("forbeslindesay-is-browser/client.js", "forbeslindesay-is-browser/index.js");
require.alias("ericgj-json-schema-hyper/index.js", "ericgj-json-schema-hyper/index.js");
require.alias("ericgj-json-schema-valid/index.js", "json-schema-suite/deps/json-schema-valid/index.js");
require.alias("ericgj-json-schema-valid/validate.js", "json-schema-suite/deps/json-schema-valid/validate.js");
require.alias("ericgj-json-schema-valid/context.js", "json-schema-suite/deps/json-schema-valid/context.js");
require.alias("ericgj-json-schema-valid/deepequal.js", "json-schema-suite/deps/json-schema-valid/deepequal.js");
require.alias("ericgj-json-schema-valid/type/object.js", "json-schema-suite/deps/json-schema-valid/type/object.js");
require.alias("ericgj-json-schema-valid/type/array.js", "json-schema-suite/deps/json-schema-valid/type/array.js");
require.alias("ericgj-json-schema-valid/type/string.js", "json-schema-suite/deps/json-schema-valid/type/string.js");
require.alias("ericgj-json-schema-valid/type/numeric.js", "json-schema-suite/deps/json-schema-valid/type/numeric.js");
require.alias("ericgj-json-schema-valid/type/enum.js", "json-schema-suite/deps/json-schema-valid/type/enum.js");
require.alias("ericgj-json-schema-valid/format/regex.js", "json-schema-suite/deps/json-schema-valid/format/regex.js");
require.alias("ericgj-json-schema-valid/format/js-function.js", "json-schema-suite/deps/json-schema-valid/format/js-function.js");
require.alias("ericgj-json-schema-valid/format/non-blank.js", "json-schema-suite/deps/json-schema-valid/format/non-blank.js");
require.alias("ericgj-json-schema-valid/index.js", "json-schema-suite/deps/json-schema-valid/index.js");
require.alias("ericgj-json-schema-valid/index.js", "json-schema-valid/index.js");
require.alias("ericgj-json-schema-core/index.js", "ericgj-json-schema-valid/deps/json-schema-core/index.js");
require.alias("ericgj-json-schema-core/refs.js", "ericgj-json-schema-valid/deps/json-schema-core/refs.js");
require.alias("ericgj-json-schema-core/correlation.js", "ericgj-json-schema-valid/deps/json-schema-core/correlation.js");
require.alias("ericgj-json-schema-core/index.js", "ericgj-json-schema-valid/deps/json-schema-core/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-core/deps/json-schema-uri/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-core/deps/json-schema-uri/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-uri/index.js");
require.alias("component-each/index.js", "ericgj-json-schema-core/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-type/index.js", "ericgj-json-schema-core/deps/type/index.js");

require.alias("component-inherit/index.js", "ericgj-json-schema-core/deps/inherit/index.js");

require.alias("component-emitter/index.js", "ericgj-json-schema-core/deps/emitter/index.js");

require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-core/deps/is-browser/client.js");
require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-core/deps/is-browser/index.js");
require.alias("forbeslindesay-is-browser/client.js", "forbeslindesay-is-browser/index.js");
require.alias("ericgj-json-schema-core/index.js", "ericgj-json-schema-core/index.js");
require.alias("component-type/index.js", "ericgj-json-schema-valid/deps/type/index.js");

require.alias("component-indexof/index.js", "ericgj-json-schema-valid/deps/indexof/index.js");

require.alias("component-each/index.js", "ericgj-json-schema-valid/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-to-function/index.js", "ericgj-json-schema-valid/deps/to-function/index.js");

require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-valid/deps/is-browser/client.js");
require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-valid/deps/is-browser/index.js");
require.alias("forbeslindesay-is-browser/client.js", "forbeslindesay-is-browser/index.js");
require.alias("ericgj-json-schema-valid/index.js", "ericgj-json-schema-valid/index.js");
require.alias("ericgj-json-schema-agent/index.js", "json-schema-suite/deps/json-schema-agent/index.js");
require.alias("ericgj-json-schema-agent/linkheader.js", "json-schema-suite/deps/json-schema-agent/linkheader.js");
require.alias("ericgj-json-schema-agent/deref.js", "json-schema-suite/deps/json-schema-agent/deref.js");
require.alias("ericgj-json-schema-agent/index.js", "json-schema-suite/deps/json-schema-agent/index.js");
require.alias("ericgj-json-schema-agent/index.js", "json-schema-agent/index.js");
require.alias("ericgj-json-schema-core/index.js", "ericgj-json-schema-agent/deps/json-schema-core/index.js");
require.alias("ericgj-json-schema-core/refs.js", "ericgj-json-schema-agent/deps/json-schema-core/refs.js");
require.alias("ericgj-json-schema-core/correlation.js", "ericgj-json-schema-agent/deps/json-schema-core/correlation.js");
require.alias("ericgj-json-schema-core/index.js", "ericgj-json-schema-agent/deps/json-schema-core/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-core/deps/json-schema-uri/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-core/deps/json-schema-uri/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-uri/index.js");
require.alias("component-each/index.js", "ericgj-json-schema-core/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-type/index.js", "ericgj-json-schema-core/deps/type/index.js");

require.alias("component-inherit/index.js", "ericgj-json-schema-core/deps/inherit/index.js");

require.alias("component-emitter/index.js", "ericgj-json-schema-core/deps/emitter/index.js");

require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-core/deps/is-browser/client.js");
require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-core/deps/is-browser/index.js");
require.alias("forbeslindesay-is-browser/client.js", "forbeslindesay-is-browser/index.js");
require.alias("ericgj-json-schema-core/index.js", "ericgj-json-schema-core/index.js");
require.alias("ericgj-json-schema-hyper/index.js", "ericgj-json-schema-agent/deps/json-schema-hyper/index.js");
require.alias("ericgj-json-schema-hyper/index.js", "ericgj-json-schema-agent/deps/json-schema-hyper/index.js");
require.alias("ericgj-json-schema-core/index.js", "ericgj-json-schema-hyper/deps/json-schema-core/index.js");
require.alias("ericgj-json-schema-core/refs.js", "ericgj-json-schema-hyper/deps/json-schema-core/refs.js");
require.alias("ericgj-json-schema-core/correlation.js", "ericgj-json-schema-hyper/deps/json-schema-core/correlation.js");
require.alias("ericgj-json-schema-core/index.js", "ericgj-json-schema-hyper/deps/json-schema-core/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-core/deps/json-schema-uri/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-core/deps/json-schema-uri/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-uri/index.js");
require.alias("component-each/index.js", "ericgj-json-schema-core/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-type/index.js", "ericgj-json-schema-core/deps/type/index.js");

require.alias("component-inherit/index.js", "ericgj-json-schema-core/deps/inherit/index.js");

require.alias("component-emitter/index.js", "ericgj-json-schema-core/deps/emitter/index.js");

require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-core/deps/is-browser/client.js");
require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-core/deps/is-browser/index.js");
require.alias("forbeslindesay-is-browser/client.js", "forbeslindesay-is-browser/index.js");
require.alias("ericgj-json-schema-core/index.js", "ericgj-json-schema-core/index.js");
require.alias("ericgj-uritemplate/bin/uritemplate.js", "ericgj-json-schema-hyper/deps/uritemplate/bin/uritemplate.js");
require.alias("ericgj-uritemplate/bin/uritemplate.js", "ericgj-json-schema-hyper/deps/uritemplate/index.js");
require.alias("ericgj-uritemplate/bin/uritemplate.js", "ericgj-uritemplate/index.js");
require.alias("component-inherit/index.js", "ericgj-json-schema-hyper/deps/inherit/index.js");

require.alias("component-each/index.js", "ericgj-json-schema-hyper/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-type/index.js", "ericgj-json-schema-hyper/deps/type/index.js");

require.alias("component-select/index.js", "ericgj-json-schema-hyper/deps/select/index.js");
require.alias("component-to-function/index.js", "component-select/deps/to-function/index.js");

require.alias("component-find/index.js", "ericgj-json-schema-hyper/deps/find/index.js");
require.alias("component-to-function/index.js", "component-find/deps/to-function/index.js");

require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-hyper/deps/is-browser/client.js");
require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-hyper/deps/is-browser/index.js");
require.alias("forbeslindesay-is-browser/client.js", "forbeslindesay-is-browser/index.js");
require.alias("ericgj-json-schema-hyper/index.js", "ericgj-json-schema-hyper/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-agent/deps/json-schema-uri/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-agent/deps/json-schema-uri/index.js");
require.alias("ericgj-json-schema-uri/index.js", "ericgj-json-schema-uri/index.js");
require.alias("component-emitter/index.js", "ericgj-json-schema-agent/deps/emitter/index.js");

require.alias("component-each/index.js", "ericgj-json-schema-agent/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-type/index.js", "ericgj-json-schema-agent/deps/type/index.js");

require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-agent/deps/is-browser/client.js");
require.alias("forbeslindesay-is-browser/client.js", "ericgj-json-schema-agent/deps/is-browser/index.js");
require.alias("forbeslindesay-is-browser/client.js", "forbeslindesay-is-browser/index.js");
require.alias("ericgj-json-schema-agent/index.js", "ericgj-json-schema-agent/index.js");
require.alias("visionmedia-superagent/lib/client.js", "json-schema-suite/deps/superagent/lib/client.js");
require.alias("visionmedia-superagent/lib/client.js", "json-schema-suite/deps/superagent/index.js");
require.alias("visionmedia-superagent/lib/client.js", "superagent/index.js");
require.alias("component-emitter/index.js", "visionmedia-superagent/deps/emitter/index.js");

require.alias("RedVentures-reduce/index.js", "visionmedia-superagent/deps/reduce/index.js");

require.alias("visionmedia-superagent/lib/client.js", "visionmedia-superagent/index.js");
require.alias("forbeslindesay-is-browser/client.js", "json-schema-suite/deps/is-browser/client.js");
require.alias("forbeslindesay-is-browser/client.js", "json-schema-suite/deps/is-browser/index.js");
require.alias("forbeslindesay-is-browser/client.js", "is-browser/index.js");
require.alias("forbeslindesay-is-browser/client.js", "forbeslindesay-is-browser/index.js");
require.alias("json-schema-suite/index.js", "json-schema-suite/index.js");if (typeof exports == "object") {
  module.exports = require("json-schema-suite");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("json-schema-suite"); });
} else {
  this["jsonSchema"] = require("json-schema-suite");
}})();