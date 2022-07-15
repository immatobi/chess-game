import { createClient, RedisClientType } from 'redis';
import colors from 'colors';

interface IOptions {
    host: string;
    port: number | string;
    password: string;
    user: string
}

interface IData {
    key: string;
    value: any;
}

class redisWrapper {

    public client: RedisClientType | any;

    public async connect(options: IOptions) {

        this.client = createClient({ 
            url: `rediss://${options.user}:${options.password}@${options.host}:${options.port}`
        });

        this.client.on('error', (err: any) => {
            // console.log(`Redis Auth: ${err}`);
        })

        await this.client.connect();
        console.log(colors.yellow.inverse('Connected to REDIS'));

    }

    public async keepData(data: IData, exp: number) {

        const parsed = JSON.stringify(data.value);

        this.client.set(data.key, parsed, {
            EX: exp,
            NX: false
        });
    }

    public async fetchData(key: string) {
        const data = await this.client.get(key);
        return data === null ? null : JSON.parse(data);
    }

    public async deleteData(key: string) {
        await this.client.del(key);

    }

}

export default new redisWrapper();