import { Publisher, Subjects, TicketUpdatedEvent } from '@skticknode/common';

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
}
