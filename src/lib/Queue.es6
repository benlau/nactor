export class Queue {
    constructor(){
        this._queue = [];
    }

    get length(){
        return this._queue.length;
    }

    enqueue(item){
        this._queue.unshift(item);
    }

    dequeue(){
        return this._queue.pop();
    }
}
