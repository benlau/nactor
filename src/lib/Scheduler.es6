import { Symbol } from './Symbol';

export const SchedulerStates = {
    Stopped: Symbol('Stopped'),
    Running: Symbol('Running')
}
let Stopped = SchedulerStates.Stopped;
let Running = SchedulerStates.Running;

export class Scheduler {
    /*getFunc::void->a
    doFunc::a->void
    nextFunc::(void->void)->void*/
    constructor(nextFunc,getFunc,doFunc){
        this.getFunc = getFunc;
        this.do = doFunc;
        this.next = nextFunc;
        this._state = Stopped;
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
            this.do(item);
            return true;
        }else{
            this._state = Stopped;
            return false;
        }
    }

    _tick(){
        if(this._state === Stopped) return;

        this.next(_=>{
            if(this._state === Stopped) return;

            this.processNext();
            this._tick();
        });
    }
}
