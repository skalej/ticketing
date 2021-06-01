import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  BadRequestError,
  NotFoundError,
  OrderStatus,
  requestValidator,
  requireAuth,
} from '@skticknode/common';
import { body } from 'express-validator';
import { Ticket } from '../models/ticket';
import { Order } from '../models/order';
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

//--- we can decalre it as an env variable or in the database
const EXPIRATION_WINDOW_SECONDS = 15 * 60;

router.post(
  '/api/orders',
  requireAuth,
  [
    body('ticketId')
      .not()
      .isEmpty()
      /**
       * here Orders service is making an assumption about the database that is used
       *  by the Tickets service. So, there is a little bit of coupling that we're doing
       *  between these two servcies if we start to say you must be providing me specifically
       *  a mongoDB Id. At some point in the future we might decide to change out hte database
       *  used by the Tickets service.
       */
      .custom((ticketId: string) => mongoose.Types.ObjectId.isValid(ticketId))
      .withMessage('TicketId must be provided'),
  ],
  requestValidator,
  async (req: Request, res: Response) => {
    const { ticketId } = req.body;
    //--- find the ticket the user is trying to order in the database
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      // throw an error if ticket is null
      throw new NotFoundError();
    }

    //--- Make sure that this ticket is not already reserved
    const isReserved = await ticket.isReserved();
    if (isReserved) {
      throw new BadRequestError('Ticket is already reserved');
    }

    //--- calculate an expiration date for this order
    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

    //--- build the new order
    const order = Order.build({
      userId: req.currentUser!.id,
      status: OrderStatus.Created,
      expiresAt: expiration,
      ticket,
    });

    //--- save it to the database
    await order.save();

    //--- publish an event saying that an order was created
    const publisher = new OrderCreatedPublisher(natsWrapper.client);
    publisher.publish({
      id: order.id,
      version: order.version,
      status: order.status,
      expiresAt: order.expiresAt.toISOString(), // to get a UTC timestamp
      userId: order.userId,
      ticket: {
        id: ticket.id,
        price: ticket.price,
      },
    });

    res.status(201).send(order);
  }
);

export { router as createOrderRouter };
