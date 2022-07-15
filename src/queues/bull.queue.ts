import Bull, { QueueOptions, Queue } from 'bull';
import { generate } from '../utils/random.util'

interface IRedisConn {
    host: string;
    port: number;
    username: string;
    password: string;
}

const options: QueueOptions = {

    redis: {
        tls: {},
        connectTimeout: 80000
    },

    limiter: { max: 100, duration: 30000 }
}

interface IJobData {
    data: any;
    delay: number;
}

class BullQueue {

    private queue: Queue;
    public redisUrl: string;
    private isProcessed: boolean;

    constructor(queueName: string){

        this.redisUrl = `rediss://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${parseInt(process.env.REDIS_PORT || '6379')}`

        this.queue = new Bull(queueName + generate(4, true), this.redisUrl, options);
        this.isProcessed = false;

    }

    public async addToQueue (job: Partial<IJobData> , callback: (data: any) => void){

        // // add the job to queue
        const rand = generate(4, false);
        await this.queue.add(job.data, { 

            jobId: rand, 
            lifo: false, 
            delay: job.delay, 
            removeOnComplete: true, 
            attempts: 3 

        });


        if(!this.isProcessed){

            // process the queue: call the callback function
            this.queue.process(async (job: any, done: any) => {
                callback(job.data);
                done();
            });

            this.isProcessed = true;

        }

        // notify when the job is done
        this.queue.on('completed', (job:any, res:any) => {
            console.log(`job with the id: ${job.id} completed`)
        });

        this.queue.on('error', (err: any) => {
            // console.log(err.message);
        });

    }


}

export default BullQueue;