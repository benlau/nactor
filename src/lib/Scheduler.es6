'use strict';

import { Symbol } from './Symbol';

export const SchedulerStates = {
    Stopped: Symbol('Stopped'),
    Running: Symbol('Running')
};

let Stopped = SchedulerStates.Stopped;
let Running = SchedulerStates.Running;

export class Scheduler {
    /*getFunc::void->a
    doFunc::a->void
    nextFunc::(void->void)->void*/
    constructor(getFunc, doFunc, errFunc, nextFunc){
        this.getFunc = getFunc;
        this.do = doFunc;
        this.next = nextFunc || (process && process.nextTick ? process.nextTick : (act)=> { setTimeout(act, 0);  });
        this._state = Stopped;
        this._onError = errFunc;
    }

    start(){
        if(this._state !== Running){
            this._state = Running;
            this._tick();
        }
    }

    stop(){
        this._state = Stopped;
    }

    processNext(){
        let item = this.getFunc();
        if(item !== undefined){
            try{
                this.do(item);
                return true;
            }catch(err){
                if(this._onError){
                    this._onError(err);
                }else{
                    throw err;
                }
            }

        }else{
            this._state = Stopped;
            return false;
        }
    }

    _tick(){
        if(this._state === Stopped) { return; }

        this.next(_=>{
            if(this._state === Stopped) { return; }

            this.processNext();
            this._tick();
        });
    }
}
