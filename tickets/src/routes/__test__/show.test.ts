import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';

it('returns a 404 if the thicket is not found', async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    //--- CastError: Cast to ObjectId failed for value "lsdjflsjfdljs" at path "_id" for model "Ticket"
    //.get('/api/tickets/lsdjflsjfdljs')
    .get(`/api/tickets/${id}`)
    .send({})
    .expect(404);

  // console.log('Body: ', response.body);
});

it('returns the ticket if the ticket is found', async () => {
  //--- Option #1
  // const ticket = Ticket.build({title: '', price: 10...});
  // ticket.save();

  //--- Option #2
  const title = 'concert';
  const price = 20;
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.signup())
    .send({
      title,
      price,
    })
    .expect(201);

  const ticketResponse = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .send()
    .expect(200);

  expect(ticketResponse.body.title).toEqual(title);
  expect(ticketResponse.body.price).toEqual(price);
});
