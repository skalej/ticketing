import { Ticket } from '../ticket';

it('implements optimistic concurrency control', async (done) => {
  //--- create a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 10,
    userId: '123',
  });

  //--- save the ticket to the database
  await ticket.save();

  //--- fetch the ticket twice
  const ticketOne = await Ticket.findById(ticket.id);
  const ticketTwo = await Ticket.findById(ticket.id);

  //--- macke changes to these tickets
  ticketOne!.set({ price: 20 });
  ticketTwo!.set({ price: 30 });

  //--- save the first fetched ticket
  await ticketOne!.save();

  //--- save the second fetched ticket and expect an error
  // expect(async () => {
  //   await ticketTwo!.save();
  // }).toThrow();

  try {
    await ticketTwo!.save();
  } catch (error) {
    /**
     * if you're going to use this pattern, Jest cannot really figure out the async await situation here
     * it can't really figure out when our tests are all done when we call return right here
     * 'done' is a function that we should invoke manually, if you want to specifically tell Jest that
     * we are done with our test and that it should not expect anything else to go on with our test
     */
    return done();
  }

  throw new Error('Should not reach this point');
});

it('increments the version number on multiple saves', async () => {
  const ticket = Ticket.build({
    title: 'concert',
    price: 10,
    userId: '123',
  });

  await ticket.save();
  expect(ticket.version).toEqual(0);
  ticket.set({ price: 15 });
  await ticket.save();
  expect(ticket.version).toEqual(1);
  ticket.set({ price: 20 });
  await ticket.save();
  expect(ticket.version).toEqual(2);
});
