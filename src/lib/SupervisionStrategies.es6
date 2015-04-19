/*
Resume the subordinate, keeping its accumulated internal state
Restart the subordinate, clearing out its accumulated internal state
Stop the subordinate permanently
Escalate the failure, thereby failing itself
*/
import r from 'ramda';

export function resume(err,action,child,parent){
    return;
};
export function restart(err,action,child,parent){
    child.clearAndRestart();
};
export function stop(err,action,child,parent){
    child.die(mailbox => {
        /*what to do with the dead child's mailbox?*/
        //remove child from parent's tree
        parent._children = r.reject(r.eq(child),parent._children);
    });
};
//note escalate is the default behavior anyway
export function escalate(err,action,child,parent){
    parent.handleException(err);
};

export function resumeOn(errType){
    return [errType,resume];
};
export function restartOn(errType){
    return [errType,restart];
};
export function stopOn(errType){
    return [errType,stop];
};
//note escalate is the default behavior anyway
export function escalateOn(errType){
    return [errType,escalate];
}
