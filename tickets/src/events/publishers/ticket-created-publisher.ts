import { Publisher, Subjects, TicketCreatedEvent } from '@skticknode/common';

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;
}
