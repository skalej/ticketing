import {
  NotAuthorizedError,
  NotFoundError,
  OrderStatus,
  requireAuth,
} from '@skticknode/common';
import express, { Request, Response } from 'express';
import { OrderCancelledPublisher } from '../events/publishers/order-cancelled-publisher';
import { Order } from '../models/order';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.delete(
  '/api/orders/:id',
  requireAuth,
  async (req: Request, res: Response) => {
    //--- find order by id
    const order = await Order.findById(req.params.id).populate('ticket');
    //--- check if order is NULL
    if (!order) {
      throw new NotFoundError();
    }

    //--- check if current user owns this order or not
    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    //--- change it's status to cacelled
    order.set({
      status: OrderStatus.Cancelled,
    });

    //--- save it to the database
    await order.save();

    //--- publishing an event saying that the order is cancelled
    // TODO: publishing an event saying that the order is cancelled
    const publisher = new OrderCancelledPublisher(natsWrapper.client);
    publisher.publish({
      id: order.id,
      version: order.version,
      ticket: {
        id: order.ticket.id,
      },
    });

    //--- sned back
    res.status(204).send();
  }
);

export { router as deleteOrderRouter };
