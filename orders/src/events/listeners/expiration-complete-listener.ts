import {
  ExpirationCompleteEvent,
  Listener,
  OrderStatus,
  Subjects,
} from '@skticknode/common';
import { Message } from 'node-nats-streaming';
import { Order } from '../../models/order';
import { OrderCancelledPublisher } from '../publishers/order-cancelled-publisher';
import { queueGroupName } from './queue-group-name';

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
  queueGroupName = queueGroupName;

  async onMessage(data: ExpirationCompleteEvent['data'], msg: Message) {
    // find the order specified in the event
    const order = await Order.findById(data.orderId).populate('ticket');
    // if no order throw an error
    if (!order) {
      throw new Error('Order not found');
    }
    // if order status is completed, just ack the message
    if (order.status === OrderStatus.Complete) {
      return msg.ack();
    }
    // cancel the order by setting its status
    order.set({ status: OrderStatus.Cancelled });
    // save it in the database
    await order.save();
    // publish an order:cancelled event
    await new OrderCancelledPublisher(this.client).publish({
      id: order.id,
      version: order.version,
      ticket: {
        id: order.ticket.id,
      },
    });
    // ack the message
    msg.ack();
  }
}
