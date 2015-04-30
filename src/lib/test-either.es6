'use strict';
import r from 'ramda';
//import fantasy from 'ramda-fantasy';
import Either from 'data.either';

//let Left = fantasy.Either.Left;
//let Right = fantasy.Either.Right;

const log = msg => {
    if(r.is(Function,msg)){
        console.log(msg());
    }else{
        console.log(msg);
    }
}

/*
function tryEither() {
  return function () {
    try {
      return Right(fn.apply(this, arguments));
    } catch (e) {
      return Left(e);
    }
  };
}
*/

/*
var foo = function (a) {
    if(a < 2){
        return Left('this is bad');
    }else{
        return Right('this is good');
    }
};
*/

//function foo(a) {
//  return a < 2 ? Either.Right('this is good') : Either.Left('this is bad');
//}

//var handle = function(either){

//    either.chain(_ => {
//        log('woohooo!');
//    })
//    .orElse(_ => {
//        log('ug-oh we have an error');
//    });

/*
    either.bimap(_=>{
        log('ug-oh we have an error');
    },
    _=>{
        log('woohooo!');
    })
    */
    /*
    if(r.is(Left,either)){
        log('ug-oh we have an error');
    }else{
        log('woohooo!');
    }
    */
//    log(either.value);
//};

/*
var result1 = foo(1);
foo.chain(_=>{
    log('yay!');
})
.orElse(_=>{
    log('boo!');
})
*/
//handle(foo(1));
//handle(foo(3));



var Fail  = Either.Left
var Right = Either.Right

// Int, Int -> Either(fError, Int)
function divide(a, b) {
  return b === 0?         Fail(new Error('Division by 0.'))
  :      /* otherwise */  Right(a / b)
}

divide(5,0)
.map(_=>{
    log('success');
 })
.orElse(_=>{ log('error'); });

divide(5,1)
.map(_=>{
    log('success');
 })
.orElse(_=>{ log('error'); });
