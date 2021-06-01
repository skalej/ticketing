import nats from 'node-nats-streaming';

console.clear();

const stan = nats.connect('ticketing', 'abc', {
  url: 'http://localhost:4222',
});

stan.on('connect', () => {
  console.log('Publisher connected to NATS');

  const ticket = {
    id: '12345',
    title: 'concert',
    price: 20,
  };

  //--- to send it over to NATS streaming server, we first have to convert it into JSON.
  //    we cannot share directly a plain JavaScript object.
  const data = JSON.stringify(ticket);

  stan.publish('ticket:created', data, () => {
    console.log('Event published!');
  });
});
