import r from 'ramda';

export class NoMatch extends Error {
    constructor(args = [], message = undefined, fileName = undefined, lineNumber = undefined) { // ES6 features Default Parameters
        super(message,fileName,lineNumber); //call the parent method with super
    }
}

export function getAddMatcher(arr){
    return (test,action) => {
        arr.push([test,action]);
    };
}

export function getMatchFirst(arr){
    return (...args) => {
        var found = r.find(pair => pair[0](...args), arr);
        if(found !== undefined){
            return found[1](...args);
        }else{
            throw new NoMatch(...args,'no match found');
        }
    };
}

export function getMatchAll(arr){
    return (...args) => {
        var found = r.filter(pair => pair[0](...args), arr);
        if(found !== undefined){
            return r.map(pair => pair[1](...args),found);
        }else{
            throw new NoMatch(...args,'no match found');
        }
    };
}

export class MatchEmitter {
    constructor(){
        this.matchers = [];
        this.add = getAddMatcher(this.matchers);
        this.default = function(act){
            this.add(_ => true, act);
        };
        this.matchFirst = getMatchFirst(this.matchers);
        this.matchAll = getMatchAll(this.matchers);
    }
}

export function mixinMatchEmitter({prototype: _proto}){
    var matchers = [];
    _proto.add = getAddMatcher(matchers);
    _proto.matchFirst = getMatchFirst(matchers);
    _proto.matchAll = getMatchAll(matchers);
}
