import {
  Listener,
  OrderStatus,
  PaymentCreatedEvent,
  Subjects,
} from '@skticknode/common';
import { Message } from 'node-nats-streaming';
import { Order } from '../../models/order';
import { queueGroupName } from './queue-group-name';

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: PaymentCreatedEvent['data'], msg: Message) {
    //--- find the order
    const order = await Order.findById(data.orderId);
    //--- if no order, throw an error
    if (!order) {
      throw new Error('Order not found');
    }
    //--- change its status to complete
    order.set({ status: OrderStatus.Complete });
    //--- save changes to the database
    await order.save(); // whenever we call save, its going to increment the version number
    //--- publish an order:updated event

    //--- ack the message
    msg.ack();
  }
}
