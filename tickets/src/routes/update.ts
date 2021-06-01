import {
  BadRequestError,
  NotAuthorizedError,
  NotFoundError,
  requestValidator,
  requireAuth,
} from '@skticknode/common';
import { body } from 'express-validator';
import express, { Request, Response } from 'express';
import { Ticket } from '../models/ticket';
import { TicketUpdatedPublisher } from '../events/publishers/ticket-updated-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.put(
  '/api/tickets/:id',
  requireAuth,
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('price')
      .isFloat({ gt: 0 })
      .withMessage('Price must be greater that zero'),
  ],
  requestValidator,
  async (req: Request, res: Response) => {
    //--- gets existing ticket base on id
    const ticket = await Ticket.findById(req.params.id);

    //--- if ticket does not exist
    if (!ticket) {
      throw new NotFoundError();
    }

    //--- if thicke has been reserved, user cannot update it
    if (ticket.orderId) {
      throw new BadRequestError('Cannot edit a reserved ticket');
    }

    //--- if user does not own this ticket
    if (ticket.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    //--- update the ticket
    ticket.set({
      title: req.body.title,
      price: req.body.price,
    });
    //--- to persist changes in database
    await ticket.save();

    new TicketUpdatedPublisher(natsWrapper.client).publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: req.currentUser!.id,
      version: ticket.version,
    });

    res.send(ticket);
  }
);

export { router as updateTicketRouter };
