'use strict';

import { Symbol } from './Symbol';
import { Queue } from './Queue';
import { StateMachine, State, Trigger } from './StateMachine';
import { MatchEmitter as Emitter } from './MatchEmitter';
import { Scheduler } from './Scheduler';
import r from 'ramda';
import Promise from 'bluebird';

export const StateEnum = {
    New: Symbol('New'),
    Starting: Symbol('Starting'),
    Running: Symbol('Running'),
    Stopped: Symbol('Stopped')
};

export const SystemMsg = Symbol('SystemMsg');
export const ChildMsg = Symbol('ChildMsg');
export const UserMsg = Symbol('UserMsg');

//it has/is a state machine
export class Actor {
    constructor(){

        this._states = [];
        this._stateMachine = new StateMachine();

        this._systemMessages = new Queue();
        this._childrenMessages = new Queue();
        this._userMessages = new Queue();

        this._messageHandler = new Emitter();

        this._scheduler = new Scheduler(

            (...args) => {

                var toReturn =
                    this._systemMessages.length > 0     ? this._systemMessages.dequeue() :
                    this._childrenMessages.length > 0   ? this._childrenMessages.dequeue() :
                    this._userMessages.length > 0       ? this._userMessages.dequeue() :
                    undefined;

                return toReturn;
            },

            (...args) => {

                //for some reason, if we just call someFunc(...args), then the args get wrapped into another array
                //that has happened already here
                this._messageHandler.matchFirst.apply(this, args[0]);
            },

            this._handleProcessingException

        );

    }

    _handleProcessingException(error, argsArray){
    }

    getPromise(){

        let resolver = Promise.defer();

        return {
            promise: resolver.promise,
            deferred: resolver
        };
    }

    _addHandler(pred, act, sym){
        this._messageHandler.add(
            (...args)=>{
                return r.eq(sym, r.head(args)) &&
                    pred.apply(this, r.tail(args));
            },
            (...args) => {
                let deferred = r.head(r.tail(args));

                try{
                    let result = act.apply(this, r.tail(r.tail(args)));
                    deferred.resolve(result);
                }catch(err){
                    deferred.reject(err);
                }
            });
    }

    addSystemHandler(pred, act){
        this._addHandler(pred, act, SystemMsg);
    }

    addSystemMsg(...args){

        args.unshift(this._stateMachine);
        let { promise: toReturn, deferred: defer  } = this.getPromise();
        args.unshift(defer);
        args.unshift(SystemMsg);
        this._systemMessages.enqueue(args);

        this._scheduler.start();
        return toReturn;
    }

    addChildHandler(pred, act){
        this._addHandler(pred, act, ChildMsg);
    }

    addChildMsg(...args){

        let { promise: toReturn, deferred: deferred  } = this.getPromise();
        args.unshift(deferred);
        args.unshift(ChildMsg);
        this._childrenMessages.enqueue(args);

        this._scheduler.start();
        return toReturn;
    }

    addUserHandler(pred, act){
        this._addHandler(pred, act, UserMsg);
    }

    addUserMsg(...args){

        var { promise: toReturn, deferred: defer  } = this.getPromise();

        args.unshift(defer);
        args.unshift(UserMsg);
        this._userMessages.enqueue(args);

        this._scheduler.start();
        return toReturn;
    }

    ask(...args){
        return this.addUserMsg(...args);
    }
}
