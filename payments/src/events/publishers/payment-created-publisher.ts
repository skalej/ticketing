import { Publisher, PaymentCreatedEvent, Subjects } from '@skticknode/common';

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
}
