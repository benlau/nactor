import r from 'ramda';
import { expect, assert } from 'chai';
import { Queue } from '../../lib/Queue';
import { Scheduler } from '../../lib/Scheduler';

var log = msg => console.log(msg);

describe('Scheduler',function(done){

    it('schedules processing',function(done){
        let q = new Queue();
        q.enqueue(1);
        q.enqueue(2);
        let count = 0;
        let s = new Scheduler(

            _ => { return q.dequeue() },

            num => {
                count++;
                if(count === 2){
                    s.stop();
                    expect(q.length).to.equal(0);
                    done();
                }else if(count > 2){
                    assert.fail('scheduler should have stopped processing');
                }
            });

        //if we keep on going, it just does nothing
        s.start();
    });

    it('lets user manually process next tick',function(){
        let q = new Queue();
        q.enqueue(1);
        q.enqueue(2);
        let count = 0;
        let s = new Scheduler(

            _ => { return q.dequeue() },

            num => {
                count++;
            });

        expect(q.length).to.equal(2);
        s.processNext();
        expect(count).to.equal(1);
        expect(q.length).to.equal(1);
        s.processNext();
        expect(count).to.equal(2);
        expect(q.length).to.equal(0);

        //if we keep on going, it just does nothing
        s.processNext();
        expect(count).to.equal(2);
        expect(q.length).to.equal(0);
    });

    it('will take a handler for exceptions',function(done){
        let q = new Queue();
        q.enqueue(1);
        let count = 0;
        let s = new Scheduler(

            _ => { return q.dequeue() },

            num => {
                throw new Error('test error');
            },

            err => {
                done();
            });

            //if we keep on going, it just does nothing
            s.start();
        });

});
