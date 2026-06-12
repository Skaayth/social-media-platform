require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const auth = require('./src/auth');
const articles = require('./src/articles');
const profile = require('./src/profile');
const following = require('./src/following');
const oauth = require('./src/oauth');
const linking = require('./src/linking');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'ricebook';

let db;
let mongoClient;

app.use(cors({ 
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl) or from our frontend
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(async (req, res, next) => {
  if (!app.locals.db) {
    try {
      await initDatabase();
    } catch (err) {
      console.error('DB connection retry failed:', err.message);
      return res.status(500).send({ error: 'Database connection failed' });
    }
  }
  if (!app.locals.db) {
    return res.status(500).send({ error: 'Database connection not available' });
  }
  next();
});

app.get('/', (req, res) => {
  res.send({ message: 'Backend API is running', endpoints: ['/login', '/register', '/articles', '/headline', '/following'] });
});

auth(app);
oauth(app);
linking(app);
articles(app);
profile(app);
following(app);

async function initDatabase() {
  if (db) return db;
  
  try {
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
      tls: true,
      tlsAllowInvalidCertificates: false,
    };
    mongoClient = await MongoClient.connect(MONGODB_URI, options);
    db = mongoClient.db(DB_NAME);
    app.locals.db = db;
    console.log('Connected to MongoDB');
    return db;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('Full error:', err);
    return null;
  }
}

if (require.main === module) {
  initDatabase().catch(err => {
    console.error('Initial DB connection failed, will retry on requests:', err.message);
  });
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  initDatabase().catch(err => {
    console.error('Database initialization error:', err);
  });
}

module.exports = app;
module.exports.initDatabase = initDatabase;

