import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import cookieSession from 'cookie-session';
import { errorHandler, NotFoundError } from '@skticknode/common';

import { signinRouter } from './routes/signin';
import { signupRouter } from './routes/signup';
import { signoutRouter } from './routes/signout';
import { currentUserRouter } from './routes/current-user';

const app = express();
//--- traffic is being proxied into our application through ingress Nginx
//    Express is going to see the fact that stuff is being proxied,
//    and by default it doesn't trust this HTTPS connection
app.set('trust proxy', true);
app.use(json());

app.use(
  cookieSession({
    name: 'session',
    //--- disable encryption on this cookie
    signed: false,
    //--- cookies will only be used over an HTTPS conneciton
    //    secure: true means that cookies are only going to be shared
    //      when someone is making a request to our server over an HTTPS connection
    secure: process.env.NODE_ENV !== 'test',
    //--- samesite uses to prevent CSRF attack
    sameSite: 'strict',
  })
);

app.use(signinRouter);
app.use(signupRouter);
app.use(signoutRouter);
app.use(currentUserRouter);

// app.all('*', async (req, res, next) => {
//   //throw new NotFoundError();
//   next(new NotFoundError());
// });

app.all('*', async (req, res) => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
