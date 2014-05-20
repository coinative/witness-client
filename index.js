/* Framework modules */
/* Node modules */
var axon = require('axon');
var axonRpc = require('axon-rpc');

var rpc = function () {
  var reqSock = axon.socket('req');
  var client = new axonRpc.Client(reqSock);

  var rpc = {
    connect: function (authorities, callback) {
      authorities = authorities.map(function (authority) {
        return {
          host: authority.split(':')[0],
          port: parseInt(authority.split(':')[1])
        };
      });

      authorities.forEach(function (authority) {
        reqSock.connect(authority.port, authority.host);
      });

      reqSock.once('connect', function () {
        client.methods(function (err, methods) {
          if (err) return callback(err);

          Object.keys(methods).forEach(function (method) {
            var signature = method.split('.');
            var namespace = signature[0];
            var name = signature[1];


            rpc[name] = client.call.bind(client, method);
          });

          callback();
        });
      });
    }
  };
  return rpc;
}();

var events = function () {
  var emitterSock = axon.socket('sub-emitter');

  return {
    connect: function (authority, callback) {
      var authority = authority.split(':');
      emitterSock.bind(parseInt(authority[1]), authority[0], callback);
    },
    on: emitterSock.on
  }
}();

module.exports = {
  connect: function (rpcAuthorities, eventAuthority, callback) {
    events.connect(eventAuthority, function (err) {
      if (err) return callback(err);
      rpc.connect(rpcAuthorities, callback);
    });
  },
  query: rpc,
  events: events
};
