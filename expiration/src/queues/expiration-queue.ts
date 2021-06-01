import Queue, { Job } from 'bull';
import { ExpirationCompletePublisher } from '../events/publishers/expiration-complete-publisher';
import { natsWrapper } from '../nats-wrapper';

interface Payload {
  orderId: string;
}

const expirationQueue = new Queue<Payload>('order:expiration', {
  /**
   * we're going to add in some options to tell this queue to connect to the Redis server
   */
  redis: {
    host: process.env.REDIS_HOST,
  },
});

expirationQueue.process(async (job: Job) => {
  new ExpirationCompletePublisher(natsWrapper.client).publish({
    orderId: job.data.orderId,
  });
});

export { expirationQueue };
