var     nactor    = require("../../dist/factory"),
        expect    = require("chai").expect;

describe('Load Test',function(){
    it('tests processing a lot of stuff',function(done){
        this.timeout(20*1000);

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
                    expect(pingCount).to.equal(max);
                    expect(helloCount).to.equal(max);
                    done();
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
    });

});
