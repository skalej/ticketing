import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';

const buildTicket = async () => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'title1',
    price: 10,
  });
  await ticket.save();
  return ticket;
};

it('fetches orders for current user', async () => {
  //--- create three tickets
  const ticketOne = await buildTicket();
  const ticketTwo = await buildTicket();
  const ticketThree = await buildTicket();

  //--- create one order as user #1
  const userOne = global.signup();
  await request(app)
    .post('/api/orders')
    .set('Cookie', userOne)
    .send({
      ticketId: ticketOne.id,
    })
    .expect(201);

  //--- create two orders as user #2
  const userTwo = global.signup();
  const { body: orderOne } = await request(app)
    .post('/api/orders')
    .set('Cookie', userTwo)
    .send({
      ticketId: ticketTwo.id,
    })
    .expect(201);

  const { body: orderTwo } = await request(app)
    .post('/api/orders')
    .set('Cookie', userTwo)
    .send({
      ticketId: ticketThree.id,
    })
    .expect(201);

  //--- make request to get orders for user #2
  const response = await request(app)
    .get('/api/orders')
    .set('Cookie', userTwo)
    .send()
    .expect(200);

  //--- make sure we only got the orders for user #2
  expect(response.body.length).toEqual(2);
  expect(response.body[0].id).toEqual(orderOne.id);
  expect(response.body[1].id).toEqual(orderTwo.id);
  expect(response.body[0].ticket.id).toEqual(ticketTwo.id);
  expect(response.body[1].ticket.id).toEqual(ticketThree.id);
});
