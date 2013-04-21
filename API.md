# Prism Server API

  - [Server()](#server)
  - [Server.service()](#serverservicenamestringserviceobjectoptionsobject)
  - [Server.use()](#serverusemiddlewarefunction)
  - [Server.browserAssets()](#serverbrowserassets)
  - [Server.buildClient()](#serverbuildclient)
  - [Server.publicServices()](#serverpublicservices)
  - [Server.process()](#serverprocessanobject)
  - [Server.start()](#serverstartcallbackfunction)

## Server()

  Prism Server
  
  Example:
  
```js
  var server = new Server({
    root:          '/my/app/dir',
    dir:           'services',
    log:           console.log,
    transport:     require('rtt-engineio')(),
    events:        instanceOfAnEventEmitter,
    sessionStore:  new RedisStore({port: 6379}),
    cacheSessions: true
  });
```

## Server.service(name:String, service:Object, options:Object)

  Use a Realtime Service
  
  Examples:
  
```js
  server.service('rpc', require('rts-rpc')())
```

## Server.use(middleware:Function)

  Use pre-request middleware for rate limiting, message sanitizing etc
  
  Works exactly like Express/Connect middleware
  
  Examples:
  
```js
  server.use(require('ss-rate-limiter'));
```

## Server.browserAssets()

  Returns a list of all files which need to be sent to the browser

## Server.buildClient()

  Builds a custom client module which includes the client-side
  transport and service code you need

## Server.publicServices()

  Returns an array of non-private services which should be sent to the client

## Server.process(an:Object)

  Process Incoming Request from a Realtime Transport
  
  Examples:
  
```js
  server.process({message: '1|{"method": "callMe"}', socketId: 1234});
```

## Server.start(Callback:Function)

  Start Server
  
  Examples:
  
```js
  server.start(function() {
    console.log("Realtime Server started on port %s", server.port);
  });
```

