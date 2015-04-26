'use strict';

export class PoisonPill extends Error {
    constructor(message = undefined, fileName = undefined, lineNumber = undefined) {
        super(message, fileName, lineNumber);
    }
}
export class ActorTerminated {
    constructor(actor){
        this.actor = actor;
    }
}
export class ActorRestarted {
    constructor(actor){
        this.actor = actor;
    }
}
