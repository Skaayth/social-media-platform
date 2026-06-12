require('dotenv').config();

const request = require('supertest');
const { MongoClient } = require('mongodb');

let app;
let db;
let testUserId;
let testUsername;
let cookies;
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
  testUsername = `testUser${testUserId}`;
  
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

describe('Profile Endpoints', () => {
  describe('GET /headline', () => {
    it('should return headline for logged in user', async () => {
      const response = await request(app)
        .get('/headline')
        .set('Cookie', cookies)
        .expect(200);
      
      expect(response.body.username).toBe(testUsername);
      expect(response.body.headline).toBeTruthy();
    });
    
    it('should return headline for specific user', async () => {
      const response = await request(app)
        .get(`/headline/${testUsername}`)
        .set('Cookie', cookies)
        .expect(200);
      
      expect(response.body.username).toBe(testUsername);
      expect(response.body.headline).toBeTruthy();
    });
  });
  
  describe('PUT /headline', () => {
    it('should update headline for logged in user', async () => {
      const newHeadline = 'Updated headline!';
      
      const updateResponse = await request(app)
        .put('/headline')
        .set('Cookie', cookies)
        .send({ headline: newHeadline })
        .expect(200);
      
      expect(updateResponse.body.username).toBe(testUsername);
      expect(updateResponse.body.headline).toBe(newHeadline);
      
      const getResponse = await request(app)
        .get('/headline')
        .set('Cookie', cookies)
        .expect(200);
      
      expect(getResponse.body.headline).toBe(newHeadline);
    });
    
    it('should reject update without headline', async () => {
      const response = await request(app)
        .put('/headline')
        .set('Cookie', cookies)
        .send({})
        .expect(400);
      
      expect(response.body.error).toBeTruthy();
    });
  });
});

