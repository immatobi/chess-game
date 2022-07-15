import { Response } from 'express';

interface INotif {
    data: any;
    response: Response
}

class Notification implements INotif{

    public data: any;
    public response: Response;

    constructor(response: Response){

        if(!response){
            console.log(`notification response object is required`);
            process.exit();
        }

        this.response = response;

    }

    public async push(data: any): Promise<void>{

        if(!data && typeof(data) !== 'object'){
            console.log(`cannot push notification, data not specified or data not in correct format`);
            process.exit(1);
        }

        this.data = data;
        const _data = `data: ${JSON.stringify(this.data)}\n\n`;
        this.response.write(_data);

        this.response.end();

    }

}


export default Notification;