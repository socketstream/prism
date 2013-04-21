/* Echo service using JSON */

module.exports = function(benchmark, server, client) {

  benchmark.name = 'Simple echo service (with JSON)';

  benchmark.run = function(client) {
    client.api.echo();  
  };

  server.service('echo', {

    use: {json: true},

    server: function(server) {

      server.onmessage = function(obj, meta) {
        server.sendToSocketId(meta.socketId, obj);
      };

    },

    client: function(client) {

      client.onmessage = function(obj) {
        if (obj.m === 'Hello') benchmark.processed();
      };

      return function() {
        client.send({m: 'Hello'});
      };

    }

  });

};