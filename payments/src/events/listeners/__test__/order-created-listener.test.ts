import mongoose from 'mongoose';
import { OrderCreatedEvent, OrderStatus } from '@skticknode/common';
import { natsWrapper } from '../../../nats-wrapper';
import { OrderCreatedListener } from '../order-created-listener';
import { Message } from 'node-nats-streaming';
import { Order } from '../../../models/order';

const setup = async () => {
  //--- create a new listener
  const listener = new OrderCreatedListener(natsWrapper.client);
  //--- create a fake data object
  const data: OrderCreatedEvent['data'] = {
    id: mongoose.Types.ObjectId().toHexString(),
    ticket: {
      id: '21312321',
      price: 20,
    },
    status: OrderStatus.Created,
    expiresAt: '2342343',
    userId: '23423424',
    version: 0,
  };
  //--- create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };
  //--- return all
  return { listener, data, msg };
};

it('replicates the order info', async () => {
  const { listener, data, msg } = await setup();
  //--- call onMessage
  await listener.onMessage(data, msg);
  //--- assert that the order is Created
  const order = await Order.findById(data.id);
  expect(order!.price).toEqual(data.ticket.price);
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();
  //--- call onMessage
  await listener.onMessage(data, msg);
  //--- make sure the ack function is called
  expect(msg.ack).toHaveBeenCalledTimes(1);
});
