import { OrderCancelledEvent, Publisher, Subjects } from '@skticknode/common';

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}
