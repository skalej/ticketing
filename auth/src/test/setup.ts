import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../app';

declare global {
  namespace NodeJS {
    interface Global {
      signup(): Promise<string[]>;
    }
  }
}

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
global.signup = async () => {
  const email = 'test@test.com';
  const password = 'password';

  const response = await request(app)
    .post('/api/users/signup')
    .send({ email, password })
    .expect(201);

  const cookie = response.get('Set-Cookie');
  return cookie;
};
