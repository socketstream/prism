"use strict";

/*!
 * Prism Realtime Server - Session Store
 * Copyright(c) 2013 Owen Barnes <owen@socketstream.org>
 * MIT Licensed
 */

var connect = require('connect');

function SessionStore (options) {
  options = options || {};

  this.store = options.store || new connect.session.MemoryStore();
  this.maxAge = options.maxAge || null;
}

SessionStore.prototype.create = function(sessionId) {
  sessionId = sessionId || connect.utils.uid(24);
  var session = new connect.session.Session({sessionID: sessionId, sessionStore: this.store});
  session.cookie = {maxAge: this.maxAge};
  session.save();
  return session;
};

SessionStore.prototype.findOrCreate = function(sessionId, cb) {
  var self = this;
  this.store.load(sessionId, function(err, session) {

    if (err) { return cb(err); }

    // Create a new session if we don't have this sessionId in memory
    if (!session) session = self.create(sessionId);

    // Append our own Save method
    session.save = function(cb) {
      self.store.set(sessionId, session, cb);
    };

    cb(null, session);
  });
};

module.exports = SessionStore;