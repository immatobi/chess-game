import nodecron from 'node-cron'
import eventEmitter, { EventEmitter } from 'events'

//  # ┌────────────── second (optional) *, 0 - 59
//  # │ ┌──────────── minute *, 0 - 59
//  # │ │ ┌────────── hour *, 0 - 23
//  # │ │ │ ┌──────── day of month *, 1 - 31
//  # │ │ │ │ ┌────── month *, 1 - 12, Jan, Feb, Mar ... Dec, January, February, March ... December
//  # │ │ │ │ │ ┌──── day of week *, 0 - 7, 0, 1, 2, 3, 4, 5, 6, 7, Mon, Tue ... Sun, Monday, Tuesday ... Sunday
//  # │ │ │ │ │ │
//  # │ │ │ │ │ │
//  # * * * * * *

//// NB: both 0 and 7 represent Sunday 

//// using ranges
// (1-10 * * * * *)  // run from first to the 10th second of every min, hour bla bla

//// selecting certain timepoints
// (10,40 30,59 * * * *)  // run every 10th and 40th second of every 30th and 59th minutes bla bla

//// step values
// (*/2 * * * * *)  // run every 2 seconds of every minute of every hour bla bla

//// cron methods
// .start()  .stop()  

//// timezones & options
// cron.schedule('0 0 5 * * *', () => {
//     console.log('running every 5th hour of everyday, month, year and day of week')
// }, {
//     scheduled: false // this means it won't run until you do .start();
//     timezone: "America/New_Yourk"
// })

// validation
// cron.validate('* * * * * *')  // returns true or false


interface IWorker {
    cron: any | string;
    task: any;
    schedule(callback: any, scheduled: boolean, zone: string): void;
    stop(): void;
    start(): void;
    destroy(): void;
    validate(cron: any | string): boolean
}

class Worker implements IWorker {

    public cron: string;  // save cron string here
    public task: any;  // save current task here
    public event: EventEmitter; // save event emiiter here

    constructor(){
        this.cron = '* * * * * *';  // default to every second of every minute of every hour bla bla..
        this.event = new eventEmitter();
    }

    get expression(){
        return this.cron;
    }

    set expression(cron: any | string){
        this.cron = cron ? cron : '* * * * * *';
    }

    schedule = (scheduled: boolean, zone: any, cb: any) => {

        if(this.validate(this.cron)){

            if(scheduled && scheduled === true){

                this.task = nodecron.schedule(
                    this.cron, 
                    cb, 
                    { 
                        scheduled: false,
                        timezone: zone ? zone : ''
                    }
                );
    
            }else{
    
                this.task = nodecron.schedule(this.cron, cb, { timezone: zone ? zone : '' });
    
            }

        }else{

            throw new Error('cron expression is invalid');

        }

        process.on('SIGINT', () => { this.stop() });  // watch for signal intercept or interruptions
        process.on('SIGTERM', () => { this.stop() })  // watch for signal termination

    }

    validate = (cron: any | string): boolean => {
        return nodecron.validate(cron);
    }

    stop = () => {
        if(this.task){
            this.task.stop();
        }
    }

    start = () => {
        if(this.task){
            this.task.start();
        }
    }

    destroy = () => {
        if(this.task){
            this.task.destroy();
        }
    }

}

export default Worker;