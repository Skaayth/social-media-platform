require('dotenv').config();

const request = require('supertest');
const { MongoClient } = require('mongodb');

let app;
let db;
let testUserId;
let mongoClient;

beforeAll(async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const DB_NAME = 'ricebook_test';
  mongoClient = await MongoClient.connect(MONGODB_URI);
  db = mongoClient.db(DB_NAME);
  
  process.env.DB_NAME = DB_NAME;
  app = require('../index');
  await app.initDatabase();
  app.locals.db = db;
  
  testUserId = Math.random().toString(36).substring(7);
}, 30000);

afterAll(async () => {
  if (db) {
    await db.collection('users').deleteMany({ username: { $regex: /^testUser/ } });
    await db.collection('profiles').deleteMany({ username: { $regex: /^testUser/ } });
    await db.collection('articles').deleteMany({ author: { $regex: /^testUser/ } });
  }
  if (mongoClient) {
    await mongoClient.close();
  }
});

describe('Authentication Endpoints', () => {
  let testUsername;
  let cookies;
  
  beforeEach(() => {
    testUsername = `testUser${testUserId}`;
  });
  
  describe('POST /register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          username: testUsername,
          password: '123',
          email: `${testUsername}@test.com`,
          dob: '128999122000',
          phone: '123-456-7890',
          zipcode: '12345'
        })
        .expect(200);
      
      expect(response.body.result).toBe('success');
      expect(response.body.username).toBe(testUsername);
      
      const user = await db.collection('users').findOne({ username: testUsername });
      expect(user).toBeTruthy();
      expect(user.salt).toBeTruthy();
      expect(user.hash).toBeTruthy();
    });
    
    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          username: testUsername
        })
        .expect(400);
      
      expect(response.body.error).toBeTruthy();
    });
  });
  
  describe('POST /login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/register')
        .send({
          username: testUsername,
          password: '123',
          email: `${testUsername}@test.com`
        });
    });
    
    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: testUsername,
          password: '123'
        })
        .expect(200);
      
      expect(response.body.result).toBe('success');
      expect(response.body.username).toBe(testUsername);
      
      cookies = response.headers['set-cookie'];
      expect(cookies).toBeTruthy();
    });
    
    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: testUsername,
          password: 'wrongpassword'
        })
        .expect(401);
      
      expect(response.body.error).toBeTruthy();
    });
    
    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          username: 'nonexistent',
          password: '123'
        })
        .expect(401);
      
      expect(response.body.error).toBeTruthy();
    });
  });
  
  describe('PUT /logout', () => {
    beforeEach(async () => {
      await request(app)
        .post('/register')
        .send({
          username: testUsername,
          password: '123',
          email: `${testUsername}@test.com`
        });
      
      const loginResponse = await request(app)
        .post('/login')
        .send({
          username: testUsername,
          password: '123'
        });
      
      cookies = loginResponse.headers['set-cookie'];
    });
    
    it('should logout successfully', async () => {
      const response = await request(app)
        .put('/logout')
        .set('Cookie', cookies)
        .expect(200);
      
      expect(response.text).toBe('OK');
      
      const headlineResponse = await request(app)
        .get('/headline')
        .set('Cookie', cookies)
        .expect(401);
    });
  });
});

