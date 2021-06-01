import nats from 'node-nats-streaming';
import { randomBytes } from 'crypto';
import { TicketCreatedListener } from './events/ticket-created-listener';

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

  new TicketCreatedListener(stan).listen();
});

//--- watching for interrupt signal
process.on('SIGINT', () => stan.close());
//--- watching for terminate signal
process.on('SIGTERM', () => stan.close());
