import { OrderCreatedEvent, Publisher, Subjects } from '@skticknode/common';

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
}
