// Note: This file was auto-generated at Sun Apr 21 2013 20:32:31 GMT+0200 (CEST). Do not modify!

module.exports = function(options) {

  var client = require('prism-client')(options);

  // Pass through any config from the server
  client.config = '{}';

  // Define Realtime Transport
  var transport = function (options) {

  options = options || {};
  options.protocol = options.protocol || 'ws';
  options.host = options.host || 'localhost';

  options.reconnection = options.reconnection || {
    attempts: Infinity,
    minDelay: 1000,
    maxDelay: 8000
  };
  
  var attemptReconnect = true;
  var reconnectionAttempts = 0;
  var reconnecting = false;

  // TODO: Move this to transport lib
  var debug = function() {
    var args = Array.prototype.slice.call(arguments);
    if (options.debug) console.log.apply(console, args);
  };

  // Connect
  return function (client) {
  
    var url = options.protocol + '://' + options.host + ':' + options.port;

    function reconnect() {
      if (!attemptReconnect) return;

      // Attempt reconnection
      // Note: most of this logic is from socket.io-client at the moment
      var self = this;
      reconnectionAttempts++;

      if (reconnectionAttempts > options.reconnection.attemps) {
        client.status.emit('reconnect_failed');
        reconnecting = false;
      } else {
        var delay = reconnectionAttempts * options.reconnection.minDelay;
        delay = Math.min(delay, options.reconnection.maxDelay);
        debug('Waiting %dms before reconnect attempt', delay);

        reconnecting = true;
        var timer = setTimeout(function(){
          debug('Attempting reconnect...');

          // unlike sockjs, engine.io reuses the same connection instance
          socket.open(function(err){
            if (err) {
              debug('Reconnect attempt error :(');
              reconnect();
              return client.status.emit('reconnect_error', err.data);
            } else {
              debug('Reconnect success! :)');
              reconnectionAttempts = 0;
              reconnecting = false;
              return client.status.emit('reconnected');
            }
          });

        }, delay);
      }
    }

    debug('Connecting to', url);

    var socket = new eio(url);

    socket.on('open', function(){
      return client.status.emit('open');
    });

    socket.on('close', function() {
      client.status.emit('close');
      reconnect();
    });

    socket.on('message', function(msg) {
      debug('RECV', msg);
      client.process({message: msg});
    });


    // Return API
    return {

      disconnect: function() {
        attemptReconnect = false;
        socket.close();
      },

      write: function(msg) {
        debug('SEND', msg);
        socket.send(msg);
      }
    };

  };

};

  client.transport = transport({"port":3001});
  // Define Realtime Services

  // Code for 'rpc' Realtime Service
  client.provide({"id":1,"name":"rpc","options":{},"use":{"json":true,"callbacks":true,"sessions":true}}, function (client) {

  function defaultCallback(x) {
    return console.log(x);
  }

  // Return API to call functions on the server
  return function() {
    var args = Array.prototype.slice.call(arguments);

    var msg = { m: args[0] };
    var lastArg = args[args.length - 1];

    var cb;
    if (typeof lastArg === 'function') {
      msg.p = args.slice(1, args.length - 1);
      cb = lastArg;
    } else {
      msg.p = args.slice(1);
      cb = defaultCallback;
    }

    client.send(msg, function(obj){
      if (obj.e) {
        console.error('RPC server error:', obj.e.message);
      } else {
        cb.apply(cb, obj.p);
      }
    });

    // Always return 'undefined'      
    return void 0;
  };

});

  return client;
};
