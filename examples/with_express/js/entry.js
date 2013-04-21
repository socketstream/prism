// Entry file

var app = require('./client')();

app.connect(function(err, info) {

  console.log('Connected to the server!', info);

});

// just so you can play with it from the console...
window.app = app;