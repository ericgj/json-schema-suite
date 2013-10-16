
# json-schema-suite

  JSON Schema components bundled for easy use.

  Configures the Schema with validation and hyperlink plugins, and exposes
  the Agent, as well as Schema and Validator for further configuration.

## Installation

component:

    $ component install ericgj/json-schema-suite

npm:
    $ npm install json-schema-suite


## Example

  ```javascript

  var suite = require('json-schema-suite')
    , Agent = suite.Agent
    , Validator = suite.Validator
    , listener = Validator.emitter()

  listener.on('error', function(e){
    console.error(e);
  })

  var agent = new Agent()
  agent.base(window.location.origin);

  agent.get('http://my.site/api', function(err,corr){
    if (corr.validate()) {
      //...
    }
  })


  ```

## API

See [json-schema-agent][agent], [json-schema-valid][valid],
[json-schema-core][core] for details.

## Running tests

### In browser

  ```sh
  $ node test/server.js
  ```
  And browse `http://localhost:3000`.

### In node

  ```sh
  $ node test/server.js &
  $ npm test
  ```

## License

  MIT


[agent]: https://github.com/ericgj/json-schema-agent
[valid]: https://github.com/ericgj/json-schema-valid
[core]: https://github.com/ericgj/json-schema-core

