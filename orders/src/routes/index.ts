import { requireAuth } from '@skticknode/common';
import express, { Request, Response } from 'express';
import { Order } from '../models/order';

const router = express.Router();

router.get('/api/orders', requireAuth, async (req: Request, res: Response) => {
  //--- get the orders with associated tickets owned by current user.
  const orders = await Order.find({ userId: req.currentUser!.id }).populate(
    'ticket'
  );
  //--- send them back
  res.send(orders);
});

export { router as indexOrdersRouter };
