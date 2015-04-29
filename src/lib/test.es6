import r from 'ramda';
import { Either } from 'ramda-fantasy';

const log = msg => {
    if(r.is(Function,msg)){
        console.log(msg());
    }else{
        console.log(msg);
    }
}

/*
it('maps the first function over the left value', function() {
var e = Either(1, null);
var result = e.bimap(add(1));
assert.equal(true, result.equals(Either(2, null)));
});
*/

let test = Either(_ => {return 1;},3);
log(test.value);

let test2 = Either(3,_ => {return 1;});
log(test.value);

function add(a) {
    return function(b) { return a + b; };
}

var e = Either(1, null);
//var result = e.Left.bimap(add(1));
log('left ' + e.Right);
/*
assert.equal(true, result.equals(Either(2, null)));

let test3 = Either(null,3);
let result3 = test3.bimap(_ => {return 1;});
log('left ' + result3.Left);
log('right ' + result3.Right);
*/
