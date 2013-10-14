
/**
 * Module dependencies.
 */

var express = require('express')
  , app = express()

app.get('/schema/:name', function(req,res){
  var root = __dirname + '/schema/';
  res.set('Link', '</schema/meta/schema.json>;rel="describedBy"');
  res.sendfile( root + req.params.name );
});

app.use(express.static(__dirname));
app.use(express.static(__dirname + '/..'));
app.use(express.static(__dirname + '/schema/meta'));

app.listen(3000);
console.log('test server listening on port 3000');


