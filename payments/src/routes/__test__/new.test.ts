import { OrderStatus } from '@skticknode/common';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order } from '../../models/order';
import { Payment } from '../../models/payment';
import { stripe } from '../../stripe';

// jest.mock('../../stripe');

it('returns a 404 when purchasing an order that does not exist', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signup())
    .send({
      token: 'aslkdfjlas',
      orderId: mongoose.Types.ObjectId().toHexString(),
    })
    .expect(404);
});

it('returns a 401 when purchasing an order that does not belong to the user', async () => {
  // create an save an order
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    price: 20,
    status: OrderStatus.Created,
    userId: '123',
  });
  await order.save();

  // try to pay the order with another user
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signup())
    .send({
      token: '2kjsjdkfskjhf',
      orderId: order.id,
    })
    .expect(401);
});
it('returns a 400 when purchasing a cancelled order', async () => {
  const userId = mongoose.Types.ObjectId().toHexString();
  // create an save an order
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    price: 20,
    status: OrderStatus.Cancelled,
    userId: userId,
  });
  await order.save();

  // try to pay the order with another user
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signup(userId))
    .send({
      token: '2kjsjdkfskjhf',
      orderId: order.id,
    })
    .expect(400);
});

it('returns a 201 with valid inputs ', async () => {
  const price = Math.floor(Math.random() * 100000);
  const userId = mongoose.Types.ObjectId().toHexString();
  // create an save an order
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    price,
    status: OrderStatus.Created,
    userId: userId,
  });
  await order.save();

  // create a payment for that order
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signup(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id,
    })
    .expect(201);

  const stripeCharges = await stripe.charges.list({ limit: 50 });
  const stripeCharge = stripeCharges.data.find(
    (charge) => charge.amount === price * 100
  );

  expect(stripeCharge).toBeDefined();
  expect(stripeCharge!.currency).toEqual('usd');

  const payment = await Payment.findOne({
    orderId: order.id,
    stripeId: stripeCharge!.id,
  });

  expect(payment).not.toBeNull();
});

//--- test with mock object
// it('returns a 201 with valid inputs ', async () => {
//   const userId = mongoose.Types.ObjectId().toHexString();
//   // create an save an order
//   const order = Order.build({
//     id: mongoose.Types.ObjectId().toHexString(),
//     price: 20,
//     status: OrderStatus.Created,
//     userId: userId,
//   });
//   await order.save();

//   // create a payment for that order
//   await request(app)
//     .post('/api/payments')
//     .set('Cookie', global.signup(userId))
//     .send({
//       token: 'tok_visa',
//       orderId: order.id,
//     })
//     .expect(201);

//   expect(stripe.charges.create).toHaveBeenCalled();
//   const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];
//   expect(chargeOptions.source).toEqual('tok_visa');
//   expect(chargeOptions.amount).toEqual(order.price * 100);
//   expect(chargeOptions.currency).toEqual('usd');
// });
