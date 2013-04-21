/* Echo service using sessions */

module.exports = function(benchmark, server, client) {

  benchmark.name = 'Simple echo service (with sessions from cache)';

  benchmark.run = function(client) {
    client.api.echo();  
  };
  
  server.service('echo', {

    use: {sessions: true},

    server: function(server) {

      server.onmessage = function(msg, meta) {
        server.sendToSocketId(meta.socketId, msg);
      };

    },

    client: function(client) {

      client.onmessage = function(msg) {
        if (msg === 'Hello') benchmark.processed();
      };

      return function() {
        client.send('Hello');
      };

    }

  });

};