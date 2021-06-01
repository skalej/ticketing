import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';
import { BadRequestError, requestValidator } from '@skticknode/common';

import { User } from '../models/user';
import { Password } from '../services/password';

const router = express.Router();

router.post(
  '/api/users/signin',
  [
    body('email').isEmail().withMessage('Email must be valid'),
    body('password')
      .trim()
      .notEmpty()
      .withMessage('You must supply a password'),
  ],
  requestValidator,
  async (req: Request, res: Response) => {
    //--- get the information from request body
    const { email, password } = req.body;

    //--- check if user with this email exists
    const existingUser = await User.findOne({ email: email });

    //--- if there is no user in db
    if (!existingUser) {
      throw new BadRequestError('Invalid Credentials');
    }

    //--- compare the passwrods
    const passwordsMatch = await Password.compare(
      existingUser.password,
      password
    );
    //--- if passwords not match
    if (!passwordsMatch) {
      throw new BadRequestError('Invalid Credentials');
    }

    //--- user is now considered to be logged in
    const userJwt = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY!
    );

    //--- store it on session object
    req.session = {
      jwt: userJwt,
    };

    res.status(200).send(existingUser);
  }
);

export { router as signinRouter };
