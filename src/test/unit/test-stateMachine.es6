import r from 'ramda';
import { expect, assert } from 'chai';
import { StateMachine, State, Trigger, StateAlreadyExists } from '../../lib/StateMachine';

var log = msg => console.log(msg);

describe('StateMachine',function(done){

    it('provides helper functions for building states',function(){


        let state = State.make;

        var s = state('first',
            Trigger('foo','bar'),
            Trigger('fizz','buzz')
        );

        expect(s.name.toString()).to.equal('first');

        expect(s.emitter.matchers.length).to.equal(2);

        expect(s.emitter.matchers[0][0]).to.equal('foo');
        expect(s.emitter.matchers[0][1]).to.equal('bar');

        expect(s.emitter.matchers[1][0]).to.equal('fizz');
        expect(s.emitter.matchers[1][1]).to.equal('buzz');
    });

    it('can be initialized empty',function(){
        var m = new StateMachine();

        expect(true).to.equal(true);
    });

    it('will not allow a state to be configured more than once',function(){
        let state = State.make;
        var m = new StateMachine('foo',
            [state('first',
                Trigger('foo','bar'),
                Trigger('fizz','buzz')
            )]
        );

        try{

            m.addState(
                [state('first',
                    Trigger('foo','bar'),
                    Trigger('fizz','buzz')
            )]);
            assert.fail('should not be allowed to configure a state more than once');

        }catch(err){
            expect(r.is(StateAlreadyExists,err)).to.equal(true);
        }
    });

    it('allows you to trigger state changes',function(){

        let state = State.make;

        var states = [
            state('first',
                Trigger(r.always(true),s => { return s; })
            ),
            state('second',
                Trigger(r.always(true),s => { return s; })
            )
        ];

        var m = new StateMachine('first',states);


        expect(m.state.toString()).to.equal('first');
        expect(m.state).to.equal(m.states.first);

        m.trigger(m.states.second);
        expect(m.state.toString()).to.equal('second');
        expect(m.state).to.equal(m.states.second);
    });

});
