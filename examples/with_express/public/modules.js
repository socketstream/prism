;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
// Entry file

var app = require('./client')();

app.connect(function(err, info) {

  console.log('Connected to the server!', info);

});

// just so you can play with it from the console...
window.app = app;
},{"./client":2}],2:[function(require,module,exports){
(function(){// Note: This file was auto-generated at Sun Apr 21 2013 20:32:31 GMT+0200 (CEST). Do not modify!

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

})()
},{"prism-client":3}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],5:[function(require,module,exports){
(function(process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

})(require("__browserify_process"))
},{"__browserify_process":4}],6:[function(require,module,exports){
/**
 *  Internal system service used to send session ID and discover other services
 */

/* Don't warn about eval - it's the only way to download */
/* code from the server and run it on the client */
/* jshint evil: true */

module.exports = function(app) {

  app.provide({id: "0", name: "_system", private: true, use: {json: true, callbacks: true}}, function(client){

    // If a request to the server returns an error, show it here
    client.onmessage = function(obj){
      if (obj.type === 'error') {
        console.error('Server Error: ' + obj.message);
      }
    };
    
    return {

      // Pass session ID if we have one
      connect: function(cb) {
        client.send({c: 'connect', v: app.version, sessionId: app._getSessionId()}, function(clientInfo){
          app._setSessionId(clientInfo.sessionId);
          app.status.emit('ready');
          if (cb) cb(null, clientInfo);
        });
      },

      // Download list of available services from the server
      discover: function(options, cb){
        options = options || {};
        client.send({c: 'discover', p: options}, function(reply){

          reply.forEach(function(service){
            var handler;
            eval('handler = ' + service.handler);
            app.provide(service.params, handler);
          });

          cb();

        });
      }
    };
  });

};
},{}],3:[function(require,module,exports){
(function(){"use strict";

/*!
 * Prism Realtime Client
 * Copyright(c) 2013 Owen Barnes <owen@socketstream.org>
 * MIT Licensed
 */

/* global unescape, escape */

/**
 * Module dependencies.
 */


var EE = require('events').EventEmitter;
var Service = require('realtime-service-client');
var systemService = require('./lib/system-service');


/**
 * Prism Client
 */

function Client(options) {
  options = options || {};

  this.services = {};
  this.api = {};
  this.status = new EE();
  this.version = '0.0.1';

  this.transport = options.transport || null;
  this.sessionCookieName = options.sessionCookieName || 'connect.sid';

  this._registerSystemService();
}


/**
 *  Provide details of a service running on the server (saves needing to discover)
 */

Client.prototype.provide = function(params, handler) {
  var service = new Service(this, params);
  this.services[service.id] = service;
  var api = handler(service);
  if (api) {
    // Hide private services if client support JS 1.8.5
    if (Object.defineProperty && service.private) {
      Object.defineProperty(this.api, service.name, {value: api, enumerable: false});
    } else {
      this.api[service.name] = api;  
    }
    return api;
  }
  return null;
};


/**
 *  Load all services in from an Array
 */

Client.prototype.load = function(services) {
  services.forEach(function(service){
    this.provide(service.paramsForClient(), service.clientApi);   
  }.bind(this));
};


/**
 *  Discover which services are available and download the client-side code from the server.
 */

Client.prototype.discover = function(cb) {
  this.api._system.discover({}, cb);
};


/**
 *  Process an incoming message string
 */

Client.prototype.process = function(req) {
  var msgAry = req.message.split('|');
  var serviceId = msgAry.shift();
  var service = this.services[serviceId];
  if (service) {
    service.read(msgAry);
  } else {
    throw('Unable to process incoming message. Service ID ' + serviceId + ' not found');
  }
};


/**
 *  Attempt to connect. When successful, transmit sessionId
 */

Client.prototype.connect = function(cb) {
  this.status.on('open', function(){
    this.api._system.connect(cb);  
  }.bind(this));
  this.connection = this.transport(this);
};


/**
 *  Attempt to get session ID from cookie
 */

Client.prototype._getSessionId = function() {
  if (typeof document === 'undefined') return false;
  var c_end, c_start;
  if (document.cookie.length > 0) {
    c_start = document.cookie.indexOf(this.sessionCookieName + "=");
    if (c_start !== -1) {
      c_start = c_start + this.sessionCookieName.length + 1;
      c_end = document.cookie.indexOf(";", c_start);
      if (c_end === -1) c_end = document.cookie.length;
      return unescape(document.cookie.substring(c_start, c_end));
    }
  }
  return false;
};


Client.prototype._registerSystemService = function() {
  systemService(this);
};


/**
 *  Set new session ID cookie
 */

Client.prototype._setSessionId = function(value) {
  if (typeof document === 'undefined') return false;
  var exdays = 1;
  var exdate = new Date();
  exdate.setDate(exdate.getDate() + exdays);
  var c_value = escape(value) + ((exdays === null) ? "" : "; expires=" + exdate.toUTCString());
  document.cookie = this.sessionCookieName + "=" + c_value;
};


module.exports = function(options){
  return new Client(options);
};
})()
},{"events":5,"./lib/system-service":6,"realtime-service-client":7}],7:[function(require,module,exports){
"use strict";

/*!
 * Realtime Service - Client
 * Copyright(c) 2013 Owen Barnes <owen@socketstream.org>
 * MIT Licensed
 */


function Client(services, params) {
  this.services = services;

  this.id = params.id;
  this.name = params.name;
  this.use = params.use || {};
  this.options = params.options || {};
  this.private = params.private || false;

  // for optional callbacks
  this.cbCount = 0;
  this.cbStack = {};

  this.msgAttrs = [];
  if (this.use.callbacks) this.msgAttrs.push('callbackId');
}

Client.prototype.read = function(msgAry) {
  var attrs = {}, cb = null;

  // Parse message attributes  
  if (this.msgAttrs.length > 0) {
    for (var i = 0; i < this.msgAttrs.length; i++) {
      attrs[this.msgAttrs[i]] = msgAry.shift();
    }
  }

  // Get message content
  var msg = msgAry.join('|');

  // Try to fetch Callback ID
  var cbId = Number(attrs.callbackId);
  if (cbId) cb = this.cbStack[cbId];

  // Decode to object
  if (this.use.json) {
    try {
      msg = JSON.parse(msg);
    } catch (e) {
      console.log(this);
    }
  }

  // Fire callback or pass to generic onmessage handler
  (cb || this.onmessage)(msg);

  // Clean up and callback
  if (cbId) delete this.cbStack[cbId];
};

Client.prototype.send = function(msg, cb) {
  var msgAry = [this.id];

  // Encode to JSON
  if (this.use.json) msg = JSON.stringify(msg);

  // Optionally add callback to stack
  if (this.use.callbacks) {
    var cbId = ++this.cbCount;
    this.cbStack[cbId] = cb;
    msgAry.push(cbId);
  }

  // Assemble final message
  msgAry.push(msg);
  msg = msgAry.join('|');

  // Send to server
  this.services.connection.write(msg);
};

/**
 * Browser-friendly debug (won't break in old IE)
 */

Client.prototype.debug = function() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('DEBUG ' + this.name + ':');
  if (this.options.debug) {
    if (window.console && console.log)
      Function.prototype.apply.call(console.log, console, args);
  }
};

module.exports = Client;
},{}]},{},[1])
;