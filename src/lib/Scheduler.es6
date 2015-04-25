export class Scheduler {
    /*getFunc::void->a
    doFunc::a->void
    nextFunc::(void->void)->void*/
    constructor(nextFunc,getFunc,doFunc){
        this.getFunc = getFunc;
        this.do = doFunc;
        this.next = nextFunc;
        this._state = 'STOPPED';
    }

    start(){
        this._state = 'RUNNING';
        this._tick();
    }

    stop(){
        this._state = 'STOPPED';
    }

    processNext(){
        let item = this.getFunc();
        if(item !== undefined){
            this.do(item);
            return true;
        }else{
            return false;
        }
    }

    _tick(){
        if(this._state === 'STOPPED') return;

        this.next(_=>{
            if(this._state === 'STOPPED') return;

            this.processNext();
            this._tick();
        });
    }
}
