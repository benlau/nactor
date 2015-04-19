export class PoisonPill extends Error {
    constructor(message = undefined, fileName = undefined, lineNumber = undefined) { // ES6 features Default Parameters
        super(message,fileName,lineNumber); //call the parent method with super
    }
}

export class ActorDied extends Error {
    constructor(mailbox = [], message = undefined, fileName = undefined, lineNumber = undefined) { // ES6 features Default Parameters
        super(message,fileName,lineNumber); //call the parent method with super
        this.mailbox = mailbox;
    }
}

export class Termination {
    constructor(actor){
        this.actor = actor;
    }
}
