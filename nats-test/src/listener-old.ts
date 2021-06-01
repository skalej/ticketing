import nats, { Message, Stan } from 'node-nats-streaming';
import { randomBytes } from 'crypto';

console.clear();

const stan = nats.connect('ticketing', `${randomBytes(4).toString('hex')}`, {
  url: 'http://localhost:4222',
});

stan.on('connect', () => {
  console.log('Listener connected to NATS');

  stan.on('close', () => {
    console.log('NATS connection closed');
    //--- manually exit the program
    process.exit();
  });
  /**
   * setManualAckMode(true)
   *  the node-nats-streaming library is no longer going to automatically
   *  acknowledge or tell the Nats streaming library that we have received
   *  the event. instead, it will be up to you to run some processing on
   *  that event, and then after that entire process is complete we wil
   *  then acknowledge the message
   */
  const options = stan
    .subscriptionOptions()
    .setManualAckMode(true)
    .setDeliverAllAvailable() // configures the subscription to replay from first available message
    .setDurableName('accounting-service');

  const subscription = stan.subscribe(
    'ticket:created', //--- name of the channel we want to listen for
    'queue-group-name', //--- queue group name
    options
  );

  subscription.on('message', (msg: Message) => {
    const data = msg.getData();

    if (typeof data === 'string') {
      console.log(`Received event #${msg.getSequence()}, with data: ${data}`);
    }

    msg.ack();
  });
});

//--- watching for interrupt signal
process.on('SIGINT', () => stan.close());
//--- watching for terminate signal
process.on('SIGTERM', () => stan.close());
