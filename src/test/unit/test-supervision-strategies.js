var     nactor      = require("../../lib/factory"),
        expect      = require("chai").expect,
        assert      = require('chai').assert,
        Strategy    = require('../../lib/SupervisionStrategies'),
        resumeOn    = Strategy.resumeOn,
        stopOn      = Strategy.stopOn,
        restartOn   = Strategy.restartOn,
        escalateOn  = Strategy.escalateOn;

import {ActorTerminated, ActorRestarted, PoisonPill as Poison} from '../../lib/SystemMessages';
import r from 'ramda';

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


        var internal = parent.getInternalActor();
        child.onMatch(r.is(ActorTerminated), _ => {
            expect(internal._children.length).to.equal(0);
            done();
        });

        expect(internal._children.length).to.equal(1);

        child.ask('dangerous');//this should kick off the exception which ultimately gets re-thrown by parent
        child.ask('hello',function(){ assert.fail('this handler should never get called') });

    });

    it('provides a restart strategy',function(done){

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
            restartOn(Poison)
        ],child);

        //when we stop the child a 'dead actor' error should get propagated up to here
        parent.onUncaughtException(function(err,action){
            //done();
            assert.fail('all exceptions raised should get caught');
        });


        var internal = child.getInternalActor();

        child.onMatch(r.is(ActorRestarted), _ => {
            expect(parent.getInternalActor()._children.length).to.equal(1);
            expect(internal._state).to.equal('IDLE');
        });

        expect(parent.getInternalActor()._children.length).to.equal(1);

        child.ask('dangerous');//this should kick off the exception
        child.ask('hello',function(){ done(); });
    });


    it('provides an escalate strategy',function(done){

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
            escalateOn(Poison)
        ],child);

        parent.onUncaughtException(function(err,action){
            done();
        });

        child.ask('dangerous');//this should kick off the exception which ultimately gets re-thrown by parent
    });

    it('escalates entirely up the chain',function(done){

        var grandParent = nactor.actor({
            hello: function(){ return "Done"; }
        });
        grandParent.init();

        var parent = nactor.actor({
            hello: function(){ return "Done"; }
        });
        parent.init();

        var child = nactor.actor({
            hello: function(){ return "Done"; },
            dangerous: function(){ throw new Poison("this should fail"); }
        });
        child.init();

        grandParent.supervise([],parent);

        parent.supervise([
            escalateOn(Poison)
        ],child);

        grandParent.onUncaughtException(function(err,action){
            done();
        });

        child.ask('dangerous');//this should kick off the exception which ultimately gets re-thrown by parent
    });
});
