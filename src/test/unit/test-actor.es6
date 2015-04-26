import r from 'ramda';
import { expect, assert } from 'chai';
import { Actor } from '../../lib/NewActor';
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

        //kb.addUserMsg('foo'); also works
        kb.ask('foo');
    });

});
