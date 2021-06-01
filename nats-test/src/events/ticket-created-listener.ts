import { Message } from 'node-nats-streaming';
import { Listener } from './base-listener';
import { Subjects } from './subjects';
import { TicketCreatedEvent } from './ticket-created-event';

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;
  queueGroupName = 'payments-service';

  onMessage(data: TicketCreatedEvent['data'], msg: Message): void {
    console.log('Event data!', data);

    //--- we're presumably going to have some business logic here
    //    if the business logic fails for any reason we want to just allow this message to timeout
    //    so that NATS attempts to re-deliver it automatically at some point in time in the future
    msg.ack();
  }
}
