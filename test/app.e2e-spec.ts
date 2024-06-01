import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import supertest, * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/identify (POST)', async () => {
    let res: supertest.Response;
    
    res = await request(app.getHttpServer()).post('/identify').send({ email: "test@gmail.com", phoneNumber: "123456" });
    expect(res.body.contact).toBeDefined();
    expect(res.body.contact.primaryContactId).toBeDefined();
    
    const primaryContactId = res.body.contact.primaryContactId;

    res = await request(app.getHttpServer()).post('/identify').send({ email: null, phoneNumber: "123456" });
    expect(res.body.contact).toBeDefined();
    expect(res.body.contact.primaryContactId).toBeDefined();
    expect(res.body.contact.primaryContactId).toBe(primaryContactId);

    res = await request(app.getHttpServer()).post('/identify').send({ email: "test@gmail.com" });
    expect(res.body.contact).toBeDefined();
    expect(res.body.contact.primaryContactId).toBeDefined();
    expect(res.body.contact.primaryContactId).toBe(primaryContactId);

    res = await request(app.getHttpServer()).post('/identify').send({ email: "test@gmail.com", phoneNumber: "23456" });
    expect(res.body.contact).toBeDefined();
    expect(res.body.contact.primaryContactId).toBeDefined();
    expect(res.body.contact.primaryContactId).toBe(primaryContactId);
    expect(res.body.contact.phoneNumbers).toBeDefined();
    expect(res.body.contact.phoneNumbers.length).toBeDefined();
    expect(res.body.contact.phoneNumbers.length).toBe(2);

    res = await request(app.getHttpServer()).post('/identify').send({ email: "test12@gmail.com", phoneNumber: "23456" });
    expect(res.body.contact).toBeDefined();
    expect(res.body.contact.primaryContactId).toBeDefined();
    expect(res.body.contact.primaryContactId).toBe(primaryContactId);
    expect(res.body.contact.phoneNumbers).toBeDefined();
    expect(res.body.contact.phoneNumbers.length).toBeDefined();
    expect(res.body.contact.phoneNumbers.length).toBe(2);
    expect(res.body.contact.emails).toBeDefined();
    expect(res.body.contact.emails.length).toBeDefined();
    expect(res.body.contact.emails.length).toBe(2);


    // Now create altogether new entry
    res = await request(app.getHttpServer()).post('/identify').send({ email: "test123@gmail.com" });
    expect(res.body.contact).toBeDefined();
    expect(res.body.contact.primaryContactId).toBeDefined();
    expect(res.body.contact.primaryContactId).not.toBe(primaryContactId);
    expect(res.body.contact.secondaryContactIds).toBeDefined();
    expect(res.body.contact.secondaryContactIds.length).toBe(0);

    // Ensure if above newly created identity merges with existing identity after discovering same phonenumber.
    res = await request(app.getHttpServer()).post('/identify').send({ email: "test123@gmail.com", phoneNumber: "23456" });
    expect(res.body.contact).toBeDefined();
    expect(res.body.contact.primaryContactId).toBeDefined();
    expect(res.body.contact.primaryContactId).toBe(primaryContactId);
    expect(res.body.contact.secondaryContactIds).toBeDefined();
    expect(res.body.contact.secondaryContactIds.length).toBe(2);
  });
});
