import express from 'express';
import { currentUser } from '@skticknode/common';

const router = express.Router();

router.get('/api/users/currentuser', currentUser, (req, res) => {
  //--- if there is no req.currentUser, it'll be undefined
  //    to send null instead we used '|| null' here
  res.send({ currentUser: req.currentUser || null });
});

/*
router.get('/api/users/currentuser', (req, res) => {
  //--- check if there is a cookie with JWT token
  // if(!req.session || !req.session.jwt) {
  if (!req.session?.jwt) {
    return res.send({ currentUser: null });
  }

  try {
    //--- verify the token with signing key
    const payload = jwt.verify(req.session.jwt, process.env.JWT_KEY!);
    //--- send back user information
    return res.send({ currentUser: payload });
  } catch (err) {
    //--- if there is any error during verification of JWT token
    res.send({ currentUser: null });
  }
});
*/
export { router as currentUserRouter };
