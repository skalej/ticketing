import { Listener, OrderCreatedEvent, Subjects } from '@skticknode/common';
import { Message } from 'node-nats-streaming';
import { expirationQueue } from '../../queues/expiration-queue';
import { queueGroupName } from './queue-group-name';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    const delay = new Date(data.expiresAt).getTime() - new Date().getTime(); // gives us time in milliseconds
    console.log(`Waiting ${delay} ms to process the job`);

    await expirationQueue.add(
      { orderId: data.id },
      {
        // TODO: it must be set to dely calculated before
        delay, // 10 seconds dely
      }
    );

    msg.ack();
  }
}
