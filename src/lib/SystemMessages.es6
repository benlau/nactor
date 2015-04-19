export class PoisonPill extends Error {
    constructor(message = undefined, fileName = undefined, lineNumber = undefined) { // ES6 features Default Parameters
        super(message,fileName,lineNumber); //call the parent method with super
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
