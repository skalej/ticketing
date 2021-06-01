import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import cookieSession from 'cookie-session';
import { errorHandler, NotFoundError, currentUser } from '@skticknode/common';
import { createChargeRouter } from './routes/new';

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
//--- cookie-session has to run first. so, it can take a look at the cookie
//     and set the req.session property.
app.use(currentUser); // currentUser Middleware

//--- Routers
app.use(createChargeRouter);

// app.all('*', async (req, res, next) => {
//   //throw new NotFoundError();
//   next(new NotFoundError());
// });

app.all('*', async (req, res) => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
