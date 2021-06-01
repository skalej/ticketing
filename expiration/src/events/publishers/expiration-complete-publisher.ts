import {
  ExpirationCompleteEvent,
  Publisher,
  Subjects,
} from '@skticknode/common';

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
