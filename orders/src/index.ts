import mongoose from 'mongoose';
import { app } from './app';
import { ExpirationCompleteListener } from './events/listeners/expiration-complete-listener';
import { PaymentCreatedListener } from './events/listeners/payment-created-listener';
import { TicketCreatedListener } from './events/listeners/ticket-created-listener';
import { TicketUpdatedListener } from './events/listeners/ticket-updated-listener';
import { natsWrapper } from './nats-wrapper';

const start = async () => {
  console.log('Starting......');

  if (!process.env.JWT_KEY) {
    throw new Error('JWT_KEY must be defined!');
  }
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be defined');
  }
  if (!process.env.NATS_CLIENT_ID) {
    throw new Error('NATS_CLIENT_ID must be defined');
  }
  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error('NATS_CLUSTER_ID must be defined');
  }
  if (!process.env.NATS_URL) {
    throw new Error('NATS_URL must be defined');
  }

  try {
    //--- connect to NATS streaming server
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL
    );
    natsWrapper.client.on('close', () => {
      console.log('NATS connection closed');
      //--- manually exit the program
      process.exit();
    });

    natsWrapper.client.on('reconnect', () => {
      console.log('=======> NATS Streaming client is reconnected.');
    });

    natsWrapper.client.on('reconnecting', () => {
      console.log('=======> NATS Streaming client is reconnecting...');
    });

    natsWrapper.client.on('disconnect', () => {
      console.log('NATS Streaming client is disconnected.');
    });

    natsWrapper.client.on('error', (e) => {
      console.error('=======> NATS error.', e.message);
    });

    //--- watching for interrupt signal
    process.on('SIGINT', () => {
      console.log('SIGINT called...');
      natsWrapper.client.close();
    });
    //--- watching for terminate signal
    process.on('SIGTERM', () => {
      console.log('SIGTERM called...');
      natsWrapper.client.close();
    });

    new TicketCreatedListener(natsWrapper.client).listen();
    new TicketUpdatedListener(natsWrapper.client).listen();
    new ExpirationCompleteListener(natsWrapper.client).listen();
    new PaymentCreatedListener(natsWrapper.client).listen();

    //--- connect to mongo db
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    console.log('Connected to MongoDb');
  } catch (error) {
    console.error(error);
  }

  app.listen(3000, () => {
    console.log('Listening on port 3000 !!!');
  });
};

start();
