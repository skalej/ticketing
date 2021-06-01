import {
  BadRequestError,
  NotAuthorizedError,
  NotFoundError,
  OrderStatus,
  requestValidator,
  requireAuth,
} from '@skticknode/common';
import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';
import { Order } from '../models/order';
import { Payment } from '../models/payment';
import { natsWrapper } from '../nats-wrapper';
import { stripe } from '../stripe';

const router = express.Router();

router.post(
  '/api/payments',
  requireAuth,
  [
    body('token').not().isEmpty().withMessage('token is required'),
    body('orderId').not().isEmpty().withMessage('orderId is required'),
  ],
  requestValidator,
  async (req: Request, res: Response) => {
    const { token, orderId } = req.body;
    //--- find the order
    const order = await Order.findById(orderId);
    //--- if no order, throw error
    if (!order) {
      throw new NotFoundError();
    }
    //--- if user does not own the order, throw an error
    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }
    //--- if order's status is cancelled, throw an error
    if (order.status === OrderStatus.Cancelled) {
      throw new BadRequestError('Cannot pay for a cancelled order');
    }
    //--- chares the money
    const charge = await stripe.charges.create({
      amount: order.price * 100,
      currency: 'usd',
      source: token,
      // to test you can use 'tok_visa' as token
    });

    //--- create and save new payment
    const payment = Payment.build({
      orderId: order.id,
      stripeId: charge.id,
    });
    await payment.save();

    //--- publish a payment:created event
    await new PaymentCreatedPublisher(natsWrapper.client).publish({
      id: payment.id,
      orderId: payment.orderId,
      chargeId: payment.stripeId,
    });

    //--- return response
    res.status(201).send({ id: payment.id });
  }
);

export { router as createChargeRouter };
