/*!
 *  Example of using Prism with Express
 */

// Note: Run "sudo npm install" in this dir first!

var fs = require('fs');
var path = require('path');
var express = require('express');
var browserify = require('browserify');
var prism = require('../../index');

// Choose a Realtime Transport
var transport = require('rtt-engine.io')();

// Create the server
var server = prism({port: 3001, transport: transport});

// Add a Realtime Service called "rpc"
server.service('rpc', require('rts-rpc')());

// Start Realtime Server and return server-side API
var ss = server.start(function(){
  console.log("Prism (WebSocket) Server running on port %s", server.port);
});

// Generate custom client (based upon transport and services selected)
var client = server.buildClient({});
fs.writeFileSync('js/client.js', client, 'utf8');

// Browserify everything
var b = browserify();
b.add(__dirname + '/js/entry.js');
b.bundle({}).pipe(fs.createWriteStream('public/modules.js'));

// Use whatever build system you like. Here we're just copying each client-side
// asset the server needs to the /public dir and serving them using express.static
var assetTags = server.browserAssets().map(function(asset){
  var filename = path.basename(asset.filename);
  fs.createReadStream(asset.filename).pipe(fs.createWriteStream('public/' + filename));
  return {filename: filename, type: asset.type};
});

// Add tag to server modules
assetTags.push({filename: 'modules.js', type: 'js'});


// Start Express Server
var app = express();

// Setup Jade so we can inject in our Asset Tags
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// Serve client-side assets we copied above
app.use(express.static(path.join(__dirname, 'public')));

// Serve site root
app.get('/', function(req, res){
  res.render('index.jade', {assetTags: assetTags});
});

// Start Asset Server
app.listen(3000, function(){
  console.log("Express (Asset Server) running on port 3000");
});