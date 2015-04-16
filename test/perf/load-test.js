var nactor = require("../../dist/factory")

// Utility to handle timeout
function timeout(test,value) {
  if (value == undefined ) {
    value = 1000;
  }

  var handler = setTimeout(function() {
    test.ok(false,"Timeout");
    test.done();
  },value);

  var _done = test.done;

  // Hook of test.done();
  test.done = function() {
    clearTimeout(handler);
    _done.apply(test,arguments);
  }
}

exports.loadTesing = function(test) {
  var max = 1000;
  var pingCount = 0;
  var helloCount = 0;
  var actor = nactor.actor({
      ping: function(data,async){
        var actor = this;
        async.enable();
        pingCount++;
        var timer = Math.floor((Math.random()*10)+1);
        setTimeout(function(){
          actor.emit("pong",pingCount);
          async.reply();
      },timer);
    },

    hello: function(data,async){
      async.enable();
      helloCount++;
      var timer = Math.floor((Math.random()*10)+1);
      setTimeout(function(){
        async.reply();
      },timer);

      if (helloCount == max) {
        test.equal(pingCount , max);
        test.equal(helloCount , max);
        test.done();
      }

    },

    final : function(){
    }
  });

  actor.init();

  actor.on("pong",function() {
    if (pingCount % 2 == 0) {
      actor.hello();
    } else {
      var timer = Math.floor((Math.random()*10)+1);
      setTimeout(function(){
        actor.hello();
      },timer);
    }
  });

  var i = 0;

  var handler = setInterval(function(){
    var c = i + Math.floor((Math.random()*100)+1);
    while (i < max && i < c) {
      actor.ping();
      i++;
    }
    if (i >=max){
      clearInterval(handler);
    }

  },50);


  timeout(test,20 * 1000);
}
