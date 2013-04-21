"use strict";

/*!
 * Prism Realtime Server - Build Custom Client
 * Builds a custom client module which can be consumed on the client
 * Copyright(c) 2013 Owen Barnes <owen@socketstream.org>
 * MIT Licensed
 */

module.exports = function(server) {

  var transportConfig = {port: server.port};
  
  var buf = [];

  buf.push("// Note: This file was auto-generated at " + String(Date()) + ". Do not modify!\n");

  buf.push("module.exports = function(options) {\n");

  buf.push("  var client = require('prism-client')(options);\n");

  buf.push("  // Pass through any config from the server");
  buf.push("  client.config = '" + JSON.stringify(server.config) + "';\n");

  buf.push("  // Define Realtime Transport");
  buf.push("  var transport = " + server.transport.client.toString() + ";\n");
  buf.push("  client.transport = transport(" + JSON.stringify(transportConfig) + ");");

  buf.push("  // Define Realtime Services");
  server.publicServices().forEach(function(service){
    buf.push("\n  // Code for '" + service.assigned.name + "' Realtime Service");
    buf.push("  client.provide(" + JSON.stringify(service.paramsForClient()) + ", " + service.clientApi.toString() + ");");
  });

  buf.push("\n  return client;");
  buf.push("};\n");

  return buf.join("\n");

};