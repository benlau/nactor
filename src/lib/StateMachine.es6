'use strict';

import r from 'ramda';
import { MatchEmitter } from './MatchEmitter';
import { Symbol } from './Symbol';

export class StateAlreadyExists extends Error {
    constructor(strSymbol, message = undefined, fileName = undefined, lineNumber = undefined) { // ES6 features Default Parameters
        super(message, fileName, lineNumber); //call the parent method with super
        this.strSymbol = strSymbol;
    }
}

export function Trigger(pred, act){
    return [pred, act];
}

export function getSym(str){
    return Symbol(str);
}

export class State{
    constructor(symStr, ...triggers){
        this.name = r.is(String, symStr) ? Symbol(symStr) : symStr;
        this.emitter = new MatchEmitter();
        triggers.forEach(trigger => {
            this.emitter.matchers.push(trigger);
        });
    }
    static make(symStr, ...triggers){
        return new State(symStr, ...triggers);
    }
}

export class StateMachine {

    constructor(initialState = undefined, states = []){

        this._matcher = new MatchEmitter();
        this._states = {};
        this._stateMap = {};
        this.addState(states);

        this._state = undefined;
        if(initialState !== undefined){

            this._state = this._states[initialState];
        }
    }

    get state(){
        return this._state;
    }

    get states(){
        return this._states;
    }

    addState(states){

        if(states.length < 1) { return; }

        r.forEach(state => {

            var _sym = state.name;
            var _triggers = state.emitter;
            if( this._states[_sym.description] !== undefined ){

                throw new StateAlreadyExists(_sym.toString());
            }else{

                this._stateMap[_sym] = state;
                this._states[_sym.description] = _sym;
            }

        }, states);
    }

    trigger(...args){
        let current = this._stateMap[this.state];
        this._state = current.emitter.matchFirst(...args);
    }

}
