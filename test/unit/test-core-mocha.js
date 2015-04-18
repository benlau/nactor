var   nactor    = require("../../dist/factory"),
      expect    = require("chai").expect;

describe('Die()',function(){
    it('causes an actor to stop receiving messages',function(done){
        var actor = nactor.actor({
            hello: function(){ console.log('YOU SHOULD NEVER SEE THIS'); }
        });

        actor.init();

        actor.ask("hello");
        actor.ask('hello');
        actor.ask('hello');
        actor.ask('hello');
        actor.ask('hello');

        actor.die(function(mailbox){
            expect(mailbox.length).to.gt(0);

            try{
                actor.ask('hello');
            }catch(ex){
                done();
            }

        });
    });

});

describe('core-tests',function(){
    it('tests processing',function(done){
        var actor = nactor.actor({
            wait : function(time,async){
                async.enable();
                setTimeout(function() {
                    async.reply();
                },time);
            }
        });

        actor.init();
        actor.wait(200,function(){
            done();
        });

        expect(actor.processing()).to.be.undefined;
        setTimeout(function() {
            expect(actor.processing()).to.not.undefined;
        },100);
    });

    it('tests hello world',function(done){
        var actor = nactor.actor({
            hello: function(){
                return "world";
            }
        });

        actor.init();

        actor.ask("hello",function(msg){
            expect(msg).to.equal("world");
            done();
        });
    });

    it('tests auto interface binding',function(done){
        var actor = nactor.actor({
            hello: function(){
                expect(this.name).to.equal("TestActor","The name argument should be set by init()");
                return "world";
            }
        });

        actor.init({
            name : "TestActor"
        });

        // Different then the previous test, it call "hello" instead of "ask"
        actor.hello(function(msg){
            expect(msg).to.equal("world");
            done();
        });
    });

    it('tests config with func',function(done){
        var actor = nactor.actor(function(options){
            // "this" is referred to the context of the actor. Which can be shared with all interface
            this.seq = 0;
            expect(options.name).to.equal("TestActor");

            return {
                hello : function(data) {
                    expect(data).to.not.be.undefined;
                    return {
                        target : data.target,
                        seq : ++this.seq
                    }
                }
            };

        });

        actor.init({
            name : "TestActor"
        });

        actor.hello({ target : "1"} ,function(reply){
            expect(reply.target).to.equal("1");
            expect(reply.seq).to.equal(1);
        });

        actor.hello({ target : "2"} ,function(reply){
            expect(reply.target).to.equal("2");
            expect(reply.seq).to.equal(2);
            done();
        });
    });

    it('tests async',function(done){
        var actor = nactor.actor({
            hello : function() {
                return { seq : ++this.seq};
            },
            timeout : function(data,async) {
                async.enable();
                this.seq++;
                self = this;
                setTimeout(function(){
                    async.reply({msgId : data.msgId , seq : self.seq});
                },200);
            }
        });

        actor.init({
            seq : 0
        });

        actor.timeout({msgId : 1},function(reply){
            expect(reply.msgId).to.equal(1);
            expect(reply.seq).to.equal(1);
        });

        actor.hello(function(reply){
            expect(reply.msgId).to.be.undefined;
            expect(reply.seq).to.equal(2);
        });

        actor.timeout({msgId : 2},function(reply){
            expect(reply.msgId).to.equal(2);
            expect(reply.seq).to.equal(3);
            done();
        });
    });

    it('tests uncaught exception handling',function(done){
        var actor = nactor.actor(function(options){
            this.seq = 0;

            return {
                normal: function() {
                    return {
                        seq : ++this.seq
                    }
                },
                fail : function() {
                    var target;
                    target.exec(); // It will throw exception.
                }
            }
        });

        actor.init();

        actor.onUncaughtException(function(err,action){
            expect(action).to.not.be.undefined;
        });

        actor.normal(function(reply){
            expect(reply.seq).to.equal(1);
        });

        actor.normal(function(reply){
            expect(reply.seq).to.equal(2);
        });

        actor.fail(function(reply){
            expect(false).to.equal(true,"If actor's method throw exception, it should not return");
        });

        actor.normal(function(reply){
            expect(reply.seq).to.equal(3,"Although previous call thore exception failed ,the actor still work");
            done();
        });

    });
});
