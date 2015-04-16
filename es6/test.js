//this should be found on both server and client
//------ lib.js ------
export const foo = 'fizz';

export const sqrt = Math.sqrt;
export function square(x) {
  return x * x;
}
export function diag(x, y) {
  return sqrt(square(x) + square(y));
}

console.log(foo);
