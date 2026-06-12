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

describe('Articles Endpoints', () => {
  describe('GET /articles', () => {
    it('should return empty array for new user', async () => {
      const response = await request(app)
        .get('/articles')
        .set('Cookie', cookies)
        .expect(200);
      
      expect(response.body.articles).toBeDefined();
      expect(Array.isArray(response.body.articles)).toBe(true);
    });
  });
  
  describe('POST /article', () => {
    it('should create a new article', async () => {
      const articleText = 'My first message!';
      
      const response = await request(app)
        .post('/article')
        .set('Cookie', cookies)
        .send({ text: articleText })
        .expect(200);
      
      expect(response.body.articles).toBeDefined();
      expect(Array.isArray(response.body.articles)).toBe(true);
      expect(response.body.articles.length).toBe(1);
      
      const article = response.body.articles[0];
      expect(article.text).toBe(articleText);
      expect(article.author).toBe(testUsername);
      expect(article.pid).toBeTruthy();
      expect(article.date).toBeTruthy();
      expect(article.comments).toBeDefined();
      expect(Array.isArray(article.comments)).toBe(true);
    });
    
    it('should reject article creation without text', async () => {
      const response = await request(app)
        .post('/article')
        .set('Cookie', cookies)
        .send({})
        .expect(400);
      
      expect(response.body.error).toBeTruthy();
    });
  });
  
  describe('GET /articles after creating article', () => {
    let articleId;
    
    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/article')
        .set('Cookie', cookies)
        .send({ text: 'Test article for GET /articles' });
      
      articleId = createResponse.body.articles[0].pid;
    });
    
    it('should return articles including the new one', async () => {
      const response = await request(app)
        .get('/articles')
        .set('Cookie', cookies)
        .expect(200);
      
      expect(response.body.articles).toBeDefined();
      expect(Array.isArray(response.body.articles)).toBe(true);
      expect(response.body.articles.length).toBeGreaterThan(0);
      
      const article = response.body.articles.find(a => a.pid === articleId);
      expect(article).toBeTruthy();
      expect(article.text).toBe('Test article for GET /articles');
    });
    
    it('should return specific article by id', async () => {
      const response = await request(app)
        .get(`/articles/${articleId}`)
        .set('Cookie', cookies)
        .expect(200);
      
      expect(response.body.articles).toBeDefined();
      expect(Array.isArray(response.body.articles)).toBe(true);
      expect(response.body.articles.length).toBe(1);
      expect(response.body.articles[0].pid).toBe(articleId);
    });
    
    it('should return 404 for non-existent article id', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/articles/${fakeId}`)
        .set('Cookie', cookies)
        .expect(404);
      
      expect(response.body.error).toBeTruthy();
    });
  });
});

