//this should be found on both server and client
//------ lib.js ------

var log = msg => console.log(msg);
export const foo = 'fizz';

export const sqrt = Math.sqrt;
export function square(x) {
  return x * x;
}
export function diag(x, y) {
  return sqrt(square(x) + square(y));
}

//log(foo);

var r = require('ramda');

export class NoMatch extends Error {
    constructor(args = [], message = undefined, fileName = undefined, lineNumber = undefined) { // ES6 features Default Parameters
        super(message,fileName,lineNumber); //call the parent method with super
    }
}

var testa = (a, b) => a + b > 3;
log(testa(2,1));
log(testa(2,2));

var matchers = [];
var matcher = (test,action) => {
    matchers.push([test,action]);
};

var matchFirst = (...args) => {
    var found = r.find(pair => pair[0](...args), matchers);
    if(found !== undefined){
        return found[1](...args);
    }else{
        throw new NoMatch(...args,'no match found');
    }
};

var matchAll = (...args) => {
    var found = r.filter(pair => pair[0](...args), matchers);
    if(found !== undefined){
        return r.map(pair => pair[1](...args),found);
    }else{
        throw new NoMatch(...args,'no match found');
    }
};

matcher((a, b) => a + b > 3,
        _ => log('hi gt 3'));

matcher((a, b) => a + b > 1,
        _ => log('hi gt 1'));


try{
    matchFirst(1,1);
}catch(err){
    log(err);
}

matchAll(2,2);

class TestMessage {
    constructor(message){
        this.message = message;
    }
}

matcher(msg => r.is(TestMessage,msg) && !r.isNil(msg.message),
        ({message: msg}) => log('message says ' + msg));

matcher(r.is(TestMessage),
        _ => log('test message isn\'t set'));



matchAll(new TestMessage());
matchFirst(new TestMessage('hi'));

var Emitter = require('./MatchEmitter').MatchEmitter;

var emitter = new Emitter();

emitter.add(msg => r.is(TestMessage,msg) && !r.isNil(msg.message),
({message: msg}) => log('[from emitter] message says ' + msg));

emitter.add(r.is(TestMessage),
_ => log('[from emitter] test message isn\'t set'));

emitter.matchAll(new TestMessage());
emitter.matchFirst(new TestMessage('hi'));
