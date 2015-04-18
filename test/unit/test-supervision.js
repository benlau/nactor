var     nactor      = require("../../dist/factory"),
        expect      = require("chai").expect,
        assert      = require('chai').assert,
        Poison      = require('../../dist/Errors').Poison;

describe('Supervision',function(){
    it('will re-throw child exceptions if they are not handled by a strategy',function(done){

        var parent = nactor.actor({
            hello: function(){
                return "Done";
            }
        });
        parent.init();

        var child = nactor.actor({
            hello: function(){
                return "Done";
            },
            dangerous: function(){ throw new Error("this should fail"); }
        });

        child.init();

        parent.supervise([],child);

        parent.onUncaughtException(function(err,action){
            expect(err.message).to.equal('this should fail');
            done();
        });


        child.ask("hello",function(reply){
            expect(reply).to.equal('Done');
        });

        child.ask('dangerous');//this should kick off the exception which ultimately gets re-thrown by parent
    });

    it('will delegate child exceptions handled by a strategy',function(done){

        var parent = nactor.actor({
            hello: function(){
                return "Done";
            }
        });
        parent.init();

        var child = nactor.actor({
            hello: function(){
                return "Done";
            },
            dangerous: function(){ throw new Poison("this should fail"); }
        });

        child.init();

        parent.supervise([
            [Poison, function(err,action,child,parent){
                expect(true).to.equal(true);
                done();
            }]
        ],child);

        parent.onUncaughtException(function(err,action){
            assert.fail('only exceptions thrown should be caught be strategy');
        });

        child.ask('dangerous');//this should kick off the exception which ultimately gets re-thrown by parent
    });
});
