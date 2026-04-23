import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  }, 30000);

  afterAll(() => app.close());

  it('POST /auth/guest → 201 with accessToken', () =>
    request(app.getHttpServer())
      .post('/auth/guest')
      .expect(201)
      .expect((res) => {
        expect(res.body.accessToken).toBeDefined();
        expect(typeof res.body.accessToken).toBe('string');
      }));

  it('POST /auth/register with valid body → 201', () =>
    request(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstName: 'Ali',
        lastName: 'Karimov',
        phone: '+998901234567',
        password: 'Password1!',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.userId).toBeDefined();
        expect(res.body.message).toBe('OTP sent');
      }));

  it('POST /auth/register with same phone → 409', () =>
    request(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstName: 'Ali',
        lastName: 'Karimov',
        phone: '+998901234567',
        password: 'Password1!',
      })
      .expect(409));

  it('POST /auth/login with wrong password → 401', () =>
    request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: '+998901234567', password: 'wrongpassword' })
      .expect(401));

  it('POST /auth/register with short password → 400', () =>
    request(app.getHttpServer())
      .post('/auth/register')
      .send({ firstName: 'A', lastName: 'B', phone: '+998909999999', password: 'short' })
      .expect(400));
});
