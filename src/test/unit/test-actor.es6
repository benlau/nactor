import r from 'ramda';
import { expect, assert } from 'chai';
import { Actor, SystemMsg, ChildMsg, UserMsg } from '../../lib/NewActor';
import { StateMachine, State, Trigger, StateAlreadyExists } from '../../lib/StateMachine';

var log = msg => console.log(msg);

describe('Actor',function(){
    it('has a special channel for system messages',function(done){
        let kb = new Actor();
        let count = 0;

        kb.addSystemHandler(r.always(true), (machine,_) => {
            count++;
            expect(count).to.equal(1);
            done();
        });
        kb.addSystemMsg('foo');
    });

    it('has a special channel for children messages',function(done){
        let kb = new Actor();
        let count = 0;

        kb.addChildHandler(r.always(true), msg => {
            count++;
            expect(msg).to.equal('foo');
            expect(count).to.equal(1);
            done();
        });

        kb.addChildMsg('foo');
    });

    it('has a special channel for user messages',function(done){
        let kb = new Actor();
        let count = 0;

        kb.addUserHandler(r.always(true), msg => {
            count++;
            expect(msg).to.equal('foo');
            expect(count).to.equal(1);
            done();
        });

        kb.ask('foo');
    });

    class First {}
    class Second {}

    class Third {}
    class Fourth {}
    class Fifth {}

    class Sixth {}
    class Seventh {}

    it('is deterministic in the order of message processing',function(done){
        let kb = new Actor();
        let count = 0;

        kb.addSystemHandler(
            (machine, msg) => {
                return r.is(First, msg);
            },
            msg => {
                count++;
                expect(count).to.equal(1);
        });

        kb.addSystemHandler(
            (machine, msg) => {
                return r.is(Second, msg);
            },
            msg => {
                count++;
                expect(count).to.equal(2);
        });

        kb.addChildHandler(r.is(Third), msg => {
            count++;
            expect(count).to.equal(3);
        });

        kb.addChildHandler(r.is(Fourth), msg => {
            count++;
            expect(count).to.equal(4);
        });

        kb.addChildHandler(r.is(Fifth), msg => {
            count++;
            expect(count).to.equal(5);
        });

        kb.addUserHandler(r.is(Sixth), msg => {
            count++;
            expect(count).to.equal(6);
        });

        kb.addUserHandler(r.is(Seventh), msg => {
            count++;
            expect(count).to.equal(7);
            done();
        });

        kb._systemMessages.enqueue([SystemMsg, {d: 'state machine'}, new First()]);
        kb._systemMessages.enqueue([SystemMsg, {d: 'state machine'}, new Second()]);

        kb._childrenMessages.enqueue([ChildMsg, new Third()]);
        kb._childrenMessages.enqueue([ChildMsg, new Fourth()]);
        kb._childrenMessages.enqueue([ChildMsg, new Fifth()]);

        kb._userMessages.enqueue([UserMsg, new Sixth()]);
        kb._userMessages.enqueue([UserMsg, new Seventh()]);

        kb._scheduler.start();

    });

});
