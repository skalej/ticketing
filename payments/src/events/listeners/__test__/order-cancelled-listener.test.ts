import { OrderCancelledEvent, OrderStatus } from '@skticknode/common';
import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { Order } from '../../../models/order';
import { natsWrapper } from '../../../nats-wrapper';
import { OrderCancelledListener } from '../order-cancelled-listener';

const setup = async () => {
  //--- create a listener
  const listener = new OrderCancelledListener(natsWrapper.client);
  //--- create and save an order
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    price: 10,
    status: OrderStatus.Created,
    userId: '32424332',
  });

  await order.save();
  //--- create a fake data object
  const data: OrderCancelledEvent['data'] = {
    id: order.id,
    ticket: {
      id: '323432423',
    },
    version: order.version + 1,
  };
  //--- create a fake message objectId
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };
  //--- return all
  return { listener, data, msg, order };
};

it('cancels the order', async () => {
  const { listener, data, msg, order } = await setup();
  // call the onMessage
  await listener.onMessage(data, msg);
  // assert that the order has been canceled
  const updatedOrder = await Order.findById(order.id);
  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();
  // call the onMessage
  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});
