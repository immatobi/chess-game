import appRootUrl, { resolve } from 'app-root-path'
import { renderFile } from 'ejs';
import fs from 'fs-extra'
import path from 'path'
import pdf from 'html-pdf'

const readSleep = (file: string) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const result = fs.readFileSync(file, 'utf8');
            resolve(result);
        }, 5000)
    })
}

export const renderTemplate = async (data: any): Promise<any> => {

    let htmlFile: any;

    const appUrlSource = `${appRootUrl.path}/src`;

    renderFile(
		`${appUrlSource}/views/pages/${data.template}.ejs`,
		{
			businessName: data.businessName
		},

		{},

		async (error, html) => {
            htmlFile = html;
		}
	);

    return htmlFile;

}

export const writeToHtml = async (fileName: string, data: any): Promise<any> => {

    const viewSource = `${appRootUrl.path}/src/views`;
    const outPath = path.resolve(viewSource, 'outputs');

    fs.removeSync(outPath); // delete the outputs folder if it exist
    fs.outputFileSync( path.resolve(outPath, `${fileName}.html`), data)

    return outPath + `/${fileName}.html`;

}

export const createPdfFromHtml = async (filename: string): Promise<{ error: boolean, message: string, url: string, base64: any }> => {

    const viewSource = `${appRootUrl.path}/src/views`;
    const outPath = path.resolve(viewSource, 'outputs');
    let buffer: any;

    let result: { error: boolean, message: string, url: string, base64: any } = {
        error: false, 
        message: '', 
        url: '',
        base64: null
   }

   // read in the file
   const html = fs.readFileSync(`${outPath}/${filename}.html`, 'utf-8');

   pdf.create(html).toBuffer(async (err, buffer) => {
        if(err) { 
            result.error = true;
            result.message = err.message;
        }
        const _b4 = await buffer.toString('base64'); // convert to base64
        // write to file
        fs.outputFileSync(`${outPath}/${filename}.txt`, 'data:application/pdf;base64,'+_b4);
   });

   // read the content of the file ('base64')
   result.base64 = await readSleep(`${outPath}/${filename}.txt`);
   fs.removeSync(outPath); // delete the outputs folder if it exist

   return result;

    //    pdf.create(html, { format: 'Letter' }).toFile(`${outPath}/${filename}.pdf`, (err, resp) => {

    //         if(err) { 
    //             result.error = true;
    //             result.message = err.message;
    //         }
    //         result.url = `${outPath}/${filename}.pdf`;

    //    });

}
