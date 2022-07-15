import sgMail from '@sendgrid/mail';

interface ISgTransportOptions {
    auth: {
        apiKey: string
    }
}

interface ISgMessageOptions {
    to: string | string[];
    from: string;
    subject: string;
    text: any;
    html: any;
}

interface INodemailerTransport {
    send: (options: ISgTransportOptions, data: ISgMessageOptions, callback: CallableFunction) => void
}

class SendgridTransport implements INodemailerTransport {

    public send( options: ISgTransportOptions, data: ISgMessageOptions, callback: CallableFunction): void {

        sgMail.setApiKey(options.auth.apiKey);

        sgMail.send(data)
            .then((resp) => { callback(resp) })
            .catch((err) => { callback(err) })

    }

}

export default new SendgridTransport();