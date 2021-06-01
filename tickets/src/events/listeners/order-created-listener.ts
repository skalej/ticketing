import { Listener, OrderCreatedEvent, Subjects } from '@skticknode/common';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../models/ticket';
import { natsWrapper } from '../../nats-wrapper';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';
import { queueGroupName } from './queue-group-name';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    //--- find the ticket that the order is reserving
    const ticket = await Ticket.findById(data.ticket.id);
    //--- if no ticket throw an error
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    //--- mark the ticket as being reserved by setting its orderId
    ticket.set({ orderId: data.id });
    //--- save the ticket
    await ticket.save();
    //--- publish a TicketUpdated event
    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      version: ticket.version,
      orderId: ticket.orderId,
    });
    //--- ack the message
    msg.ack();
  }
}
