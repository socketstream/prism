/* Echo service with no features */

module.exports = function(benchmark, server, client) {

  benchmark.name = 'Simple echo service';

  benchmark.run = function(client) {
    client.api.echo();  
  };
  
  server.service('echo', {

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