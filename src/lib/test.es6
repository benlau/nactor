//this should be found on both server and client
//------ lib.js ------


export const foo = 'fizz';

export const sqrt = Math.sqrt;
export function square(x) {
  return x * x;
}
export function diag(x, y) {
  return sqrt(square(x) + square(y));
}

class View {
  constructor(options) {
    this.template = options.template;
  }

  render() {
    return this.template;
  }
}

var v = new View({template: 'hello'});
console.log(v.render());

const r = require('ramda');

const log = msg => {
    if(r.is(Function,msg)){
        console.log(msg());
    }else{
        console.log(msg);
    }
}

import { Queue } from './Queue';
var q = new Queue();
console.log('queue length is ' +  q.length);
q.enqueue(3);
console.log('queue length is ' +  q.length);
console.log('queue first item is ' + q.dequeue());

//log(foo);

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
