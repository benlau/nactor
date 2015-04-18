/*
Resume the subordinate, keeping its accumulated internal state
Restart the subordinate, clearing out its accumulated internal state
Stop the subordinate permanently
Escalate the failure, thereby failing itself
*/

export function resume(err,action,child,parent){
    return;
};
export function restart(err,action,child,parent){
    return;
};
export function stop(err,action,child,parent){
    child.die();
    //remove child from parent's tree
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
