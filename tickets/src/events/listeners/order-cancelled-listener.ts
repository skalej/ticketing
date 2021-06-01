import { Listener, OrderCancelledEvent, Subjects } from '@skticknode/common';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../models/ticket';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';
import { queueGroupName } from './queue-group-name';

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
    //--- find the ticket associated with this order
    const ticket = await Ticket.findById(data.ticket.id);
    //--- if no ticket throw error
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    //--- make the ticket un-reserved by clearing out its orderId
    //ticket.set({ orderId: null });
    // optional values with Typescript don't work well with null, so instead we're going to use undefined
    ticket.set({ orderId: undefined });

    //--- save the ticket
    await ticket.save();
    //--- publish a ticket updated event to
    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      version: ticket.version,
      userId: ticket.userId,
      orderId: ticket.orderId,
    });
    //--- ack the message
    msg.ack();
  }
}
