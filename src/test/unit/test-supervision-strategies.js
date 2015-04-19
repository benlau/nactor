var     nactor      = require("../../lib/factory"),
expect      = require("chai").expect,
assert      = require('chai').assert,
Poison      = require('../../lib/Messages').PoisonPill,
Strategy    = require('../../lib/SupervisionStrategies'),
resumeOn    = Strategy.resumeOn,
stopOn      = Strategy.stopOn;

describe('Supervision Strategies',function(){
    it('provides a resume strategy',function(done){

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
            resumeOn(Poison)
        ],child);

        parent.onUncaughtException(function(err,action){
            assert.fail('only exceptions thrown should be caught be strategy');
        });

        child.ask('dangerous');//this should kick off the exception which ultimately gets re-thrown by parent
        child.ask('hello',function(){ done(); });
    });

    it('provides a stop strategy',function(done){

        var parent = nactor.actor({
            hello: function(){
                return "Done";
            }
        });
        parent.init();

        var child = nactor.actor({
            hello: function(){
                console.log('hi');
                return "Done";
            },
            dangerous: function(){ throw new Poison("this should fail"); }
        });

        child.init();

        parent.supervise([
            stopOn(Poison)
        ],child);

        //when we stop the child a 'dead actor' error should get propagated up to here
        parent.onUncaughtException(function(err,action){
            //done();
            assert.fail('all exceptions raised should get caught');
        });

        child.on('Termination',function(){
            done();
        });

        child.ask('dangerous');//this should kick off the exception which ultimately gets re-thrown by parent
        child.ask('hello',function(){ assert.fail('this handler should never get called') });
    });
});
