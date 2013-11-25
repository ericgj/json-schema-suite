
# json-schema-suite

  JSON Schema components bundled for easy use.

  - Configures Schema with validation and hyperlink plugins.
  
  - Configures the Agent to use [visionmedia/superagent][superagent] as the
    underlying http client.

  - Exposes Agent, as well as Schema and Validator for further configuration.


## Installation

component:

    $ component install ericgj/json-schema-suite

npm:

    $ npm install json-schema-suite

browser standalone:

  Include `build.js` or `build.min.js` in a script tag.
  This will give you a `window.jsonSchema` global.
  If you would prefer a different global, clone this repo and rebuild like:

    $ component install
    $ component build --standalone myGlobal

  Then move the `build/build.js` file into your project.


## Example

  ```javascript

  var suite = require('json-schema-suite')
    , Agent = suite.Agent

  var agent = new Agent();

  agent.get('/api', function(err,correlation){

    // validation
    correlation.once('error', function(e){
      console.error(e);
    })

    if (correlation.validate()) {
      //...
    }

    
    // follow resolved links in correlations
    agent.follow( correlation.rel('instances'), function(){
      //...
    });

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
[superagent]: https://github.com/visionmedia/superagent

