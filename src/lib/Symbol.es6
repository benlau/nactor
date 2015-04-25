export function Symbol(str = undefined){
    return {description: str, toString: function(){ return str }};
}
