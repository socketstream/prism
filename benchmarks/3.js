/* Echo service using callbacks */

module.exports = function(benchmark, server, client) {

  benchmark.name = 'Simple echo service (with callbacks)';

  benchmark.run = function(client) {
    client.api.echo();  
  };
  
  server.service('echo', {

    use: {callbacks: true},

    server: function(server) {

      server.onmessage = function(msg, meta, reply) {
        reply(msg);
      };

    },

    client: function(client) {

      return function() {
        client.send('Hello', function(msg) {
          if (msg === 'Hello') benchmark.processed();  
        });
      };

    }

  });

};