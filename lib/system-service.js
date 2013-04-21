"use strict";

/*!
 * Prism Realtime Server - System Service
 * Copyright(c) 2013 Owen Barnes <owen@socketstream.org>
 * MIT Licensed
 */

var SessionStore = require('./sessions');

module.exports = function(services){

  return {

    // don't send details of this service to the client
    private: true,
    
    use: {json: true, callbacks: true},
    
    server: function(server) {

      var sessionStore = new SessionStore({store: services.sessionStore});

      var socketIdsToSessionIds = {};
      var socketIdsToSessionCache = {};

      services.events.on('disconnect', function(socketId){
        //console.log('Socket ID %s has disconnected')
      });

      var commands = {
        
        // Client says hello. Server responds with a session ID
        connect: function(msg, meta, cb){

          sessionStore.findOrCreate(msg.sessionId, function(err, session){
            if (err) return cb(err);
            socketIdsToSessionIds[meta.socketId] = session.id;
            if (services.cacheSessions) socketIdsToSessionCache[meta.socketId] = session;
            var clientInfo = {version: services.version, sessionId: session.id};
            cb(null, clientInfo);
          });
         
        },

        // Client asks for a list of public services it can consume
        discover: function(msg, meta, cb) {
          var output = services.publicServices().map(function(service){
            return {params: service.paramsForClient(), handler: service.clientApi.toString()};
          });
          cb(null, output);
        }

      };

      // Respond to incoming requests
      server.onmessage = function(msg, meta, reply){      
        var command = msg.c;
        if (commands[command]) {
          commands[command](msg, meta, function(err, response){
            reply(response);
          });
        }   
      };

      // Return server-side API
      return {

        getSession: function(socketId, cb) {
          var sessionId = socketIdsToSessionIds[socketId];
          var cache = socketIdsToSessionCache[socketId];
          if (cache) return cb(null, cache);
          sessionStore.findOrCreate(sessionId, function(err, session){
            socketIdsToSessionCache[socketId] = session;
            return cb(err, session);
          });
        },

        // Send an Error Message to the client (but only in development)
        sendError: function(socketId, message){
          server.sendToSocketId(socketId, {type: 'error', message: message});
        }


      };

    }
  };
};