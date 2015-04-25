import r from 'ramda';
import { expect, assert } from 'chai';
import { Queue } from '../../lib/Queue';

var log = msg => console.log(msg);

describe('Queue',function(){
    it('adds items through enqueue',function(){
        let q = new Queue();
        expect(q.length).to.equal(0);
        q.enqueue(1);
        q.enqueue(2);
        expect(q.length).to.equal(2);
    });
    it('removes items in order through dequeue',function(){
        let q = new Queue();

        q.enqueue(1);
        q.enqueue(2);

        expect(q.dequeue()).to.equal(1);
        expect(q.length).to.equal(1);

        expect(q.dequeue()).to.equal(2);
        expect(q.length).to.equal(0);
    });
});
