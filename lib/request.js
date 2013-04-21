"use strict";

/*!
 * Prism Realtime Server - Incoming Request
 * Copyright(c) 2013 Owen Barnes <owen@socketstream.org>
 * MIT Licensed
 */


/**
 * Create new Request Object
 *
 * Example:
 *
 *     var req = new Request({message: '1|1|Hello', socketId: '12345'});
 *
 * Creating a new Request validates incoming messages and ensure they all look the same
 * (both to Realtime Services and hopefully to the V8 optimizer)
 */

function Request (params, server) {

  this.server = server;

  // Check we have some essentials
  if (typeof params !== 'object') throw new Error('Request params must be an object');
  if (typeof params.socketId !== 'string') throw new Error('No socketId provided');
  if (typeof params.message !== 'string') throw new Error('No message provided');


  /* ASSIGN MANDATORY PARAMS */

  // (String) Message (e.g. '1|1|Hello!')
  this.message = params.message;

  // (String) WebSocket ID (e.g. 'RrpACpgON9z7VPnTAAAB')
  this.socketId = params.socketId;


  /* ASSIGN OPTIONAL PARAMS */

  // (String) Name of transport (e.g. 'engineio')
  this.transport = params.transport ? String(params.transport) : 'unknown';

  // (String) Client's IP address (e.g. '127.0.0.1')
  this.clientIp = params.clientIp ? String(params.clientIp) : 'unknown';

  // Message Attributes (e.g. callbackId)
  this.attributes = params.attributes || {};

  // (Object) Session ID
  this.session = params.session || {};

}


/**
 * Process incoming messages
 */

Request.prototype.process = function() {

  var msgAry = this.message.split('|');

  // First work out which service this is for
  var serviceId = msgAry.shift();
  var service = this.server.services[serviceId];

  // Drop messages without if we can't find a service
  //if (!service) return this.eb.emit('error', 'noServiceId', req);

  // Parse optional message attributes  
  if (service.msgAttrs.length > 0) {
    for (var i = 0; i < service.msgAttrs.length; i++) {
      this.attributes[service.msgAttrs[i]] = msgAry.shift();
    }
  }

  // Recombine message
  this.message = msgAry.join('|');

  // If service doesn't require sessions, process right away
  if (!service.use.sessions) return service.server.read(this);

  // Otherwise, get Session object from in-memory cache or session store
  this.server.api._system.getSession(this.socketId, function(err, session){
 
    this.session = session;

    // Drop messages if we don't have a session
    if (this.session) return service.server.read(this);

  }.bind(this));

};

module.exports = Request;