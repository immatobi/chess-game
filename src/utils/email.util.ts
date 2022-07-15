import { renderFile } from 'ejs'
import appRootUrl from 'app-root-path'
import transporter from './sendgrid.util';

export const sendGrid = async (emailData: any) => {
	
	const options = {
		auth: {
			apiKey: process.env.SENDGRID_API_KEY || '',
		}
	}

	const appUrlSource = `${appRootUrl.path}/src`;

	renderFile(
		`${appUrlSource}/views/emails/${emailData.template}.ejs`,
		{
			preheaderText: emailData.preheaderText,
			emailTitle: emailData.emailTitle,
			emailSalute: emailData.emailSalute,
			bodyOne: emailData.bodyOne,
			bodyTwo: emailData.bodyTwo,
			loginEmail: emailData.loginEmail,
			loginPassword: emailData.loginPassword,
			buttonUrl: emailData.buttonUrl,
			buttonText: emailData.buttonText,
			eventTitle: emailData.eventTitle,
			eventDescription: emailData.eventDescription,
			startDate: emailData.startDate,
			endDate: emailData.endDate,
		},

		{},

		async (error, html) => {
			try {
				
				const mailData = {
					to: emailData.email,
					from: `${emailData.fromName ? emailData.fromName : process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
					subject: emailData.emailTitle,
					text: 'email',
					html: html,
				};

				//send mail
				transporter.send(options, mailData, (resp: any) => {
					// console.log(JSON.stringify(resp));
				});

				// eslint-disable-next-line no-catch-shadow
			} catch (error) {
				console.log(error);
				return error;
			}
		}
	);
};
