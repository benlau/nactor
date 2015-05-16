
var Actor = require("./actor"),
    Proxy =  require("./proxy");

function create(config) {
    var actor = new Actor(config);
    
    var proxy = new Proxy(actor);

    actor._on(function(event,data){
        proxy._emitter.emit(event,data);
    });
    
    actor._system = proxy.system;
    
    return proxy;
}

module.exports = {
    actor : create
};
