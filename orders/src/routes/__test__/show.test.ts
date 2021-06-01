import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';

it('fetches the order by id', async () => {
  //--- create a ticket
  const ticket = await Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });

  await ticket.save();

  //--- make a request to build an order with this ticket
  const cookie = global.signup();
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', cookie)
    .send({
      ticketId: ticket.id,
    })
    .expect(201);

  //--- make a request to fetch the order
  const { body: fetchedOrder } = await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', cookie)
    .expect(200);

  //--- make sure the order is corrent
  expect(fetchedOrder.id).toEqual(order.id);
  expect(fetchedOrder.ticket.id).toEqual(ticket.id);
});

it('returns a 401 when the order does not belong to current user', async () => {
  //--- create a ticket
  const ticket = await Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });

  await ticket.save();

  //--- make a request to create an order with this ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', global.signup())
    .send({
      ticketId: ticket.id,
    })
    .expect(201);

  //--- make a request to get the order with another user
  await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', global.signup())
    .expect(401);
});
