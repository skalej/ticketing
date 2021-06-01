import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { Ticket } from '../../models/ticket';
import { natsWrapper } from '../../nats-wrapper';

it('returns an error if ticket does not exist', async () => {
  const id = new mongoose.Types.ObjectId();
  await request(app)
    .post('/api/orders/')
    .set('Cookie', global.signup())
    .send({
      ticketId: id,
    })
    .expect(404);
});

it('returns an error if ticket is already reserved', async () => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });
  await ticket.save();

  const order = Order.build({
    ticket,
    status: OrderStatus.Created,
    expiresAt: new Date(),
    userId: 'sdlfjsljdfls',
  });
  await order.save();

  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signup())
    .send({
      ticketId: ticket.id,
    })
    .expect(400);
});

it('reservs a ticket', async () => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });
  await ticket.save();

  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signup())
    .send({
      ticketId: ticket.id,
    })
    .expect(201);
});

it('emits an order created event', async () => {
  //--- create a ticket
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });
  await ticket.save();

  //--- make a request to create an order with this ticket
  await request(app)
    .post('/api/orders')
    .set('Cookie', global.signup())
    .send({
      ticketId: ticket.id,
    })
    .expect(201);

  //--- check publish is called
  expect(natsWrapper.client.publish).toHaveBeenCalledTimes(1);
  //expect(natsWrapper.client.publish).not.toHaveBeenCalled();
});
