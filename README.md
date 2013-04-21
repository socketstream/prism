# Prism

**Warning: This is alpha software. Feedback encouraged!**

Prism is a fast, modular realtime (WebSocket) server for Node.js. Use it to power dashboards, games, and other realtime apps.

All functionality (RPC, PubSub, model syncing, etc) is provided by [Realtime Services](https://github.com/socketstream/realtime-service) - a new way to write realtime functionality and share it on `npm` without any vendor lock-in. Connect to a Prism server from the browser (or remote Node process) using [prism-client](https://github.com/socketstream/prism-client). 

Note: Prism is **just** a standalone realtime server, nothing else.  
SocketStream 0.4 uses Prism to offer a fully integrated developer experience.


## Example

```js
var prism = require('prism');
var rtt = require('rtt-engineio')();

var server = prism({port: 3001, transport: rtt});

// Add a Realtime Service called "rpc"
server.service('rpc', require('rts-rpc')());

server.start();
```

[View more examples](examples)

## Features

* designed for speed and scalability (see benchmarks below)
* no core functionality - everything is provided by modular [Realtime Services](https://github.com/socketstream/realtime-service)
* use native WebSockets, Engine.IO, SockJS, or any other [Realtime Transport](https://github.com/socketstream/realtime-transport)
* the [client](https://github.com/socketstream/prism-client) runs in the browser or a remote Node process
* share sessions between Prism and [Express.js](http://expressjs.com) (thanks to Connect Session Store)
* swap to Connect Redis Store (or similar) when you want to scale out
* generates a custom client module containing all the code you need for the browser
* prevent DDOS attacks and drop malicious messages with Connect-style middleware
* super-efficient protocol to reduce bytes over the wire (doesn't force JSON)
* optionally sends errors back to the client for easy debugging
* shared event bus so your application code can react to client disconnects
* ultra-light client-side code (for sending to browser)


## API

[View API documentation](API.md) (generated from source code)


## Truly Modular

Prism uses [Realtime Services](https://github.com/socketstream/realtime-service), a new way to provide your app with PubSub, RPC, Realtime Model functionality and more without any vendor lock-in. Realtime Services can be easily written, tested and shared on `npm`.

Combine multiple Realtime Services together to create the exact functionality your app needs. Prism automatically handles the message multiplexing for you using minimal bytes and CPU.


## Connecting from the browser

Once you've added your transport and services, Prism can (optionally) build a custom client module for you:

```js
var client = server.buildClient({});
fs.writeFileSync('client.js', client, 'utf8');
```

This module contains all the client-side code you need, based upon your choice of transport and services (minus any libraries which sadly can't be wrapped as Common JS modules - see Browser Assets below).

Use the `client.js` module you've just built in your application's client-side code as so:

```js
var app = require('./client')();
app.connect(function(err, info) {
  console.log('Connected to the server!', info);
  console.log('You can now call this API in your client code:', app.api);
});
```

Take this file, [browserify](https://github.com/substack/node-browserify) it, [minimize](https://github.com/mishoo/UglifyJS2) it and host it on a CDN.

See the [examples](examples) directory or the `prism-client` Readme for more info.


## Sessions

Prism supports sessions using the Connect Session Store. This design choice was made to allow integration with Express.js and various authentication systems (such as [Passport](http://passportjs.org/) which use Connect.

By default we use the in-memory store. This is fine for development, but not in production. Switch to a scalable session store (e.g. Connect Redis) with:

```js
var app = new Server({
  sessionStore:   new RedisStore({port: 6379})
});
```

## Scaling

The recommended way to scale Prism is behind a proxy such as HAProxy or Nginx (which now supports WebSockets).

Prism requires the load balancer to support 'sticky sessions', ensuring subsequent connections from the same browser (identified by the `connect.sid` cookie) are routed to the same back-end server. This gives a huge performance boost as all session data can be cached in RAM (although any changes are always saved back to the Session Store).

Alternatively, you're able to route all incoming requests to any back-end server you please. However, under this setup you'll have to disable in-memory session caching (with `cacheSession: false`). This will force Prism to query the Session Store on each incoming message. This will naturally be much slower, unless the Session Store is designed to be used in a distributed environment.


## Request Middleware

As incoming requests hit the server, you are able to inspect them, drop them or transform them before they are sent on to the relevant Realtime Service for processing. For performance reasons this functionality is implemented as middleware, exactly like in Express.

Available middleware modules:

[**prism-rate-limiter**](https://github.com/socketstream/prism-rate-limiter) - limits requests per second to help protect against DOS attacks

Use middleware as so:

```js
server.use(require('prism-rate-limiter')());
```


## Browser Assets

Transports and Services often need to send assets to the browser. For example, a service designed to work with Backbone may want to send a particular version of `backbone.js` to the client.

To obtain a list of static assets to send, call:

```js
var assets = server.browserAssets();
```

Unless you're using SocketStream 0.4, you'll need manually transform this Array of Objects into something your build system can use. Take a look at how we've done that in the `/examples/with_express` folder.

It's worth pointing out this area of Prism may change before Version 1 is released. I'm currently evaluating Bower as a possible solution to this problem. Feedback welcome!


## Logging

Prism is silent by default. To turn on logging of each incoming request, pass `console.log`, or your own custom logging function, to the server on startup:

```js
var app = new Server({
  port:           3001,
  transport:      engineio,
  log:            console.log
});
```

## FAQs

### Why not use Transform Streams instead of Connect-style middleware?

I tried this initially. Not only are they more complex to implement, in practice four transform streams are almost 10 times slower than four pieces of middleware on the stack. 


## Benchmarks

Install dev dependencies then run them with `npm run benchmarks'.

On a 2009 iMac, output is currently as follows:


    Benchmark 1: Simple echo service
    ✓ Requests per second: 124000

    Benchmark 2: Simple echo service (with JSON)
    ✓ Requests per second: 61000

    Benchmark 3: Simple echo service (with callbacks)
    ✓ Requests per second: 69000

    Benchmark 4: Simple echo service (with sessions from cache)
    ✓ Requests per second: 75000


Note: While the numbers are not bad, I think we can do better.
If it is necessary to change the internal APIs to improve performance I
will do so before Version 1 is released. Contributions / thoughts appreciated.


## License 

MIT
