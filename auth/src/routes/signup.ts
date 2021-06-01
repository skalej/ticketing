import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import { BadRequestError, requestValidator } from '@skticknode/common';

import { User } from '../models/user';

const router = express.Router();

router.post(
  '/api/users/signup',
  [
    body('email').isEmail().withMessage('Email must be valid'),
    body('password')
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('Password must be between 4 and 20 characters'),
  ],
  requestValidator,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    //--- email already used
    if (existingUser) {
      throw new BadRequestError('Email in use');
    }

    //--- build a new User based on requesst body
    const user = User.build({ email, password });
    //--- save user document into Mongo DB
    await user.save();

    // if(!process.env.JWT_KEY) {
    //   throw new Error('JWT_KEY must be defined!');
    // }

    //--- Generate JWT
    const userJwt = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_KEY!
    );

    //--- Store it on session object
    //    the cookie-session library is going to take this object,
    //      serialize it and then send it back to the user's browser.
    req.session = {
      jwt: userJwt,
    };

    res.status(201).send(user);
  }
);

export { router as signupRouter };
