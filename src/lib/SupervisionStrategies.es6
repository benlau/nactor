'use strict';

/*
Resume the subordinate, keeping its accumulated internal state
Restart the subordinate, clearing out its accumulated internal state
Stop the subordinate permanently
Escalate the failure, thereby failing itself
*/
import r from 'ramda';

export function resume(error, action, child, parent){
    return;
}

export function restart(error, action, child, parent){
    child.clearAndRestart();
}

export function stop(error, action, child, parent){
    child.die(mailbox => {
        /*what to do with the dead child's mailbox?*/
        //remove child from parent's tree
        parent._children = r.reject(r.eq(child), parent._children);
    });
}

//note escalate is the default behavior anyway
export function escalate(err, action, child, parent){
    parent.handleException(err);
}

export function resumeOn(errType){
    return [r.is(errType), resume];
}

export function restartOn(errType){
    return [r.is(errType), restart];
}

export function stopOn(errType){
    return [r.is(errType), stop];
}

//note escalate is the default behavior anyway
export function escalateOn(errType){
    return [r.is(errType), escalate];
}
