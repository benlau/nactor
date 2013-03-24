
var Actor = require("./actor"),
    Proxy =  require("./proxy");

function create(config) {
    var actor = new Actor(config);
    
    var proxy = new Proxy(actor);

    return proxy;
}

module.exports = {
    actor : create
};
