import mongoose from 'mongoose';
import { OrderCancelledEvent } from '@skticknode/common';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../../models/ticket';
import { natsWrapper } from '../../../nats-wrapper';
import { OrderCancelledListener } from '../order-cancelled-listener';

const setup = async () => {
  // create a listener
  const listener = new OrderCancelledListener(natsWrapper.client);
  // create and save a ticket
  const orderId = new mongoose.Types.ObjectId().toHexString();
  const ticket = Ticket.build({
    title: 'concert',
    price: 10,
    userId: '123',
  });
  ticket.set({ orderId });
  await ticket.save();
  // create a fake data object
  const data: OrderCancelledEvent['data'] = {
    id: orderId,
    version: 0,
    ticket: {
      id: ticket.id,
    },
  };
  // create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };
  // returns all
  return { listener, data, msg, ticket };
};

it('clears the orderId of the ticket', async () => {
  const { listener, data, msg, ticket } = await setup();
  // call the onMessage function with the order object and message object
  await listener.onMessage(data, msg);
  // write assertions to make sure that the orderId is set to 'undefined'
  const updatedTicket = await Ticket.findById(ticket.id);
  expect(updatedTicket?.orderId).toBeUndefined();
});

it('acks the message', async () => {
  const { listener, data, msg } = await setup();
  // call the onMessage function with the order object and message object
  await listener.onMessage(data, msg);
  // make suer the ack is called
  expect(msg.ack).toHaveBeenCalled();
});

it('publishes a ticket updated event', async () => {
  const { listener, data, msg } = await setup();
  // call the onMessage function with the order object and message object
  await listener.onMessage(data, msg);
  // makes sure the publish event on client object is called
  expect(natsWrapper.client.publish).toHaveBeenCalled();
  const updatedTicketEventData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );
  expect(updatedTicketEventData.orderId).toBeUndefined();
});
