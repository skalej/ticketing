import {
  Listener,
  OrderCancelledEvent,
  OrderStatus,
  Subjects,
} from '@skticknode/common';
import { Message } from 'node-nats-streaming';
import { Order } from '../../models/order';
import { queueGroupName } from './queue-group-name';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    //--- find the order by id and version to check the order of operations
    const order = await Order.findByEvent({
      id: data.id,
      version: data.version,
    });
    //--- if no order, throw an error
    if (!order) {
      throw new Error('Order not found');
    }
    // TODO: check if the order has a valid payment or not

    //--- set the status to cancelled
    order.set({ status: OrderStatus.Cancelled });
    //--- save the order
    await order.save();
    //--- ack the message
    msg.ack();
  }
}
