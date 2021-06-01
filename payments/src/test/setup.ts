import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

declare global {
  namespace NodeJS {
    interface Global {
      signup(id?: string): string[];
    }
  }
}

jest.mock('../nats-wrapper');
// jest.mock('../stripe.ts');

process.env.STRIPE_KEY =
  'sk_test_51IwhRNJqiR6VKiFNjok1K4V9lT6M7R6mXrhP8kCvGYxBAUN4RPjB3Vu3GUs3O00FlYMr5vL06ewlZnGTzoBbmIVi00Vjyb7yQO';

let mongo: MongoMemoryServer;
/**
 * Before all of our different tests startup, we're going to create a
 *  new instance of MongoDb memory server
 * Mongo memory server gives us direct access to this database
 *
 */
beforeAll(async () => {
  process.env.JWT_KEY = 'asdffg';

  mongo = new MongoMemoryServer();
  const mongoUri = await mongo.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async () => {
  /**
   * the mock function internally records how many times it gets called,
   *  the different arguments it's provided an so on.
   * we want to make sure before every single test we reset that data and
   *  so we're not somehow running a test and polluting one test with data
   *  from another test.
   */
  jest.clearAllMocks();

  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});

/**
 * This function assigned to the global scope so we can very easily use it
 * from all of our different test files.
 * This way we don't have to add in a very repettitive import statements into
 * all different test files at the top.
 * If you do not want to use a global function, you could always create a
 * separate file, put the function inside there and export it and the import
 * it into any relevant test file.
 */
global.signup = (id?: string) => {
  //--- Build a JWT payload. { id, email }
  const payload = {
    id: id || new mongoose.Types.ObjectId().toHexString(),
    email: 'test@test.com',
  };
  //--- Create a JWT
  const token = jwt.sign(payload, process.env.JWT_KEY!);
  //--- Build session object. { jwt: MY_JWT }
  const session = { jwt: token };
  //--- Turn that session into JSON
  const sessionJSON = JSON.stringify(session);
  //--- Take JSON and encode it as base64
  const base64 = Buffer.from(sessionJSON).toString('base64');
  //--- return a string, that's the cookie with the encoded data
  //    the expectation when we're using supertest is that we include
  //     all of the different cookies in an array
  return [`session=${base64}`];
};
