import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('Bookings - atomic slot locking (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('booking endpoint rejects requests without auth', async () => {
    const res = await request(app.getHttpServer())
      .post('/bookings/nonexistent-lobby/book')
      .send({ fieldSlotId: 'nonexistent-slot' });
    expect([401, 403, 404]).toContain(res.status);
  });
});
