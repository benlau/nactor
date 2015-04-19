import r from 'ramda';
import { expect, assert } from 'chai';

import * as matchLib from '../../lib/MatchEmitter';
var Emitter = matchLib.MatchEmitter;
var mixer = matchLib.mixinMatchEmitter;

var log = msg => console.log(msg);

class TestMessage {
    constructor(message){
        this.message = message;
    }
}

describe('MatchEmitter',function(){

    it('matches and runs the first valid matcher when asked',function(){

        var emitter = new Emitter();
        var matches = 0;

        emitter.add(msg => r.is(TestMessage,msg) && !r.isNil(msg.message),
                    ({message: msg}) => matches++/*log(msg)*/ );

        emitter.add(r.is(TestMessage),
                    _ => assert.fail('we should only match the first match'));

        emitter.matchFirst(new TestMessage('hi'));

        expect(matches).to.equal(1);
    });

    it('matches and runs all valid matchers when asked',function(){

        var emitter = new Emitter();
        var matches = 0;

        emitter.add(msg => r.is(TestMessage,msg) && !r.isNil(msg.message),
                    ({message: msg}) => matches++ );

        emitter.add(r.is(TestMessage),
                    _ => matches++ );

        emitter.matchAll(new TestMessage('hi'));

        expect(matches).to.equal(2);
    });

    it('provides a function to mixin MatchEmitter into any class',function(){
        mixer(TestMessage);

        var emitter = new TestMessage();
        var matches = 0;

        emitter.add(msg => r.is(TestMessage,msg) && !r.isNil(msg.message),
        ({message: msg}) => matches++/*log(msg)*/ );

        emitter.matchFirst(new TestMessage('hi'));

        expect(matches).to.equal(1);
    });
});
