import Axios from 'axios';
import { Client } from 'africastalking-ts'

const credentials = { apiKey: process.env.AT_API_KEY || '', username: process.env.AT_USERNAME || '' };
const client = new Client(credentials);  // define the client 

export const sendSMS = async (data: any): Promise<any> => {

    let result: any;

    const smsData = {
        to: data.numbers, // a string of comma separated numbers with countrycodes
        message: data.message,
        // from: process.env.AT_SENDER_ID,
        enqueue: true
    }

    result = await client.sendSms(smsData)
    return result.SMSMessageData;

    // status codes

    // 100: Processed
    // 101: Sent
    // 102: Queued
    // 401: RiskHold
    // 402: InvalidSenderId
    // 403: InvalidPhoneNumber
    // 404: UnsupportedNumberType
    // 405: InsufficientBalance
    // 406: UserInBlacklist
    // 407: CouldNotRoute
    // 500: InternalServerError
    // 501: GatewayError
    // 502: RejectedByGateway
   

}
