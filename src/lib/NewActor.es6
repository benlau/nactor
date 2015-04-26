import { Symbol } from './Symbol';
import { Queue } from './Queue';
import { StateMachine, State, Trigger } from './StateMachine';
import { MatchEmitter as Emitter } from './MatchEmitter';
import { Scheduler } from './Scheduler';
import r from 'ramda';
//it has 3 queues
//system
//user
//children

export const StateEnum = {
    New: Symbol('New'),
    Starting: Symbol('Starting'),
    Running: Symbol('Running'),
    Stopped: Symbol('Stopped')
}

const SystemMsg = Symbol('SystemMsg');
const ChildMsg = Symbol('ChildMsg');
const UserMsg = Symbol('UserMsg');

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

            process.nextTick,

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
                this._messageHandler.matchFirst.apply(this,args[0]);
            }

        );

    }

    _addHandler(pred,act,sym){
        this._messageHandler.add(
            (...args)=>{
                return r.eq(sym,r.head(args)) &&
                    pred(r.tail(...args));
            },
            (...args) => {
                act.apply(this,r.tail(args));
            });
    }

    addSystemHandler(pred,act){
        this._addHandler(pred,act,SystemMsg);
    }

    addSystemMsg(...args){

        args.unshift(this._stateMachine);
        args.unshift(SystemMsg);
        this._systemMessages.enqueue(args);

        this._scheduler.start();
    }

    addChildHandler(pred,act){
        this._addHandler(pred,act,ChildMsg);
    }

    addChildMsg(...args){

        args.unshift(ChildMsg);
        this._childrenMessages.enqueue(args);

        this._scheduler.start();
    }

    addUserHandler(pred,act){
        this._addHandler(pred,act,UserMsg);
    }

    addUserMsg(...args){

        args.unshift(UserMsg);
        this._userMessages.enqueue(args);

        this._scheduler.start();
    }
}
