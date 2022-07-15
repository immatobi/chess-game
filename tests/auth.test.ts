import request from 'supertest';
import app from '../src/config/app.config';

let authToken: string = '';

describe('Auth :: Login', () => {

    it('logs admin in successfully', async () => {
        
       const resp = await request(app)
        .post('/api/v1/auth/login')
        .set('Accept', 'application/json')
        .set('Content-Type',  'application/json')
        .set('lg',  'en')
        .set('ch',  'web')
        .send({
            email: "adminx@gamr.io",
            password: "#_gmAdmin1@"
        })
        .expect(200);

        expect(resp.body.token).toBeDefined();

    })

    it('detects incorrect login [email] details', async () => {
        
        const resp = await request(app)
         .post('/api/v1/auth/login')
         .set('Accept', 'application/json')
         .set('Content-Type',  'application/json')
         .set('lg',  'en')
         .set('ch',  'web')
         .send({
             email: "testxma@gmail.com",
             password: "#_gmAdmin1@"
         })
         .expect(403);
 
         expect(resp.body.errors.length).toBe(1);
 
     })

     it('detects incorrect login [password] details', async () => {
        
        const resp = await request(app)
         .post('/api/v1/auth/login')
         .set('Accept', 'application/json')
         .set('Content-Type',  'application/json')
         .set('lg',  'en')
         .set('ch',  'web')
         .send({
             email: "testxma@gmail.com",
             password: "#commanD565/"
         })
         .expect(403);
 
         expect(resp.body.errors.length).toBe(1);
 
     })

});

describe('Auth :: Register', () => {

    it('register manager successfully', async () => {

        const resp = await request(app)
        .post('/api/v1/auth/register')
        .set('Accept', 'application/json')
        .set('Content-Type',  'application/json')
        .set('lg',  'en')
        .set('ch',  'web')
        .send({
            email: "emmabidem@gmail.com",
            password: "#commanD565/",
            phoneNumber: "08137031202",
            phoneCode: "+234",
            callback: "http://localhost:5000"
        })

        expect(resp.body.status).toBeGreaterThanOrEqual(200)
        expect(resp.body.status).toBeLessThanOrEqual(400);

    })

    it('detects duplicate email', async () => {

        const resp = await request(app)
        .post('/api/v1/auth/register')
        .set('Accept', 'application/json')
        .set('Content-Type',  'application/json')
        .set('lg',  'en')
        .set('ch',  'web')
        .send({
            email: "emmabidem@gmail.com",
            password: "#commanD565/",
            phoneNumber: "08137031202",
            phoneCode: "+234",
            callback: "http://localhost:5000"
        }).expect(400)

    })

})