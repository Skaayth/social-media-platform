const md5 = require('md5');
const { ObjectId } = require('mongodb');

const sessionUser = {};
const cookieKey = 'sid';
const mySecretMessage = 'ricebook-secret-key-2024';

function getHash(password, salt) {
  return md5(password + salt);
}

function generateSalt(username) {
  return md5(username + new Date().getTime() + Math.random().toString());
}

function isLoggedIn(req, res, next) {
  let sessionId = req.cookies[cookieKey];
  
  // Check Authorization header first (for cross-origin requests)
  if (!sessionId && req.headers.authorization) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        sessionId = authHeader.replace('Bearer ', '');
      } else if (authHeader.startsWith('{')) {
        const authObj = JSON.parse(authHeader);
        sessionId = authObj.sessionId;
      } else {
        sessionId = authHeader;
      }
    } catch (e) {
      sessionId = req.headers.authorization;
    }
  }
  
  if (!sessionId || !sessionUser[sessionId]) {
    return res.status(401).send({ error: 'Unauthorized' });
  }
  
  req.username = sessionUser[sessionId].username;
  req.user = sessionUser[sessionId];
  return next();
}

async function register(req, res) {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).send({ error: 'Database connection not available' });
  }
  
  const { username, email, dob, phone, zipcode, password } = req.body;
  
  if (!username || !password || !email) {
    return res.status(400).send({ error: 'Missing required fields' });
  }
  
  try {
    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      return res.status(400).send({ error: 'Username already exists' });
    }
    
    const salt = generateSalt(username);
    const hash = getHash(password, salt);
    
    await db.collection('users').insertOne({
      username,
      salt,
      hash
    });
    
    await db.collection('profiles').insertOne({
      username,
      display: username,
      headline: 'This is my headline!',
      email: email || '',
      zipcode: zipcode || '',
      phone: phone || '',
      dob: dob || '',
      avatar: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/RDesRoches.jpg/220px-RDesRoches.jpg',
      following: []
    });
    
    res.send({ result: 'success', username });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send({ error: 'Registration failed' });
  }
}

async function login(req, res) {
  const db = req.app.locals.db;
  if (!db) {
    return res.status(500).send({ error: 'Database connection not available' });
  }
  
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).send({ error: 'Missing username or password' });
  }
  
  try {
    const userObj = await db.collection('users').findOne({ username });
    
    if (!userObj) {
      return res.status(401).send({ error: 'Invalid username or password' });
    }
    
    const hash = getHash(password, userObj.salt);
    if (hash !== userObj.hash) {
      return res.status(401).send({ error: 'Invalid username or password' });
    }
    
    const sessionKey = md5(mySecretMessage + new Date().getTime() + userObj.username);
    sessionUser[sessionKey] = { username: userObj.username };
    
    res.cookie(cookieKey, sessionKey, {
      maxAge: 3600 * 1000,
      path: '/',
      httpOnly: true,
      sameSite: 'None',
      secure: true
    });
    
    // Also send token in response for localStorage storage
    res.send({ username, result: 'success', token: sessionKey });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send({ error: 'Login failed' });
  }
}

function logout(req, res) {
  let sessionId = req.cookies[cookieKey];
  
  if (!sessionId && req.headers.authorization) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        sessionId = authHeader.replace('Bearer ', '');
      } else if (authHeader.startsWith('{')) {
        const authObj = JSON.parse(authHeader);
        sessionId = authObj.sessionId;
      } else {
        sessionId = authHeader;
      }
    } catch (e) {
      sessionId = req.headers.authorization;
    }
  }
  
  if (sessionId && sessionUser[sessionId]) {
    delete sessionUser[sessionId];
  }
  
  res.clearCookie(cookieKey);
  res.send('OK');
}

async function updatePassword(req, res) {
  const db = req.app.locals.db;
  const { password } = req.body;
  const username = req.username;
  
  if (!password) {
    return res.status(400).send({ error: 'Missing password' });
  }
  
  try {
    const salt = generateSalt(username);
    const hash = getHash(password, salt);
    
    await db.collection('users').updateOne(
      { username },
      { $set: { salt, hash } }
    );
    
    res.send({ username, result: 'success' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).send({ error: 'Password update failed' });
  }
}

module.exports = (app) => {
  app.post('/register', register);
  app.post('/login', login);
  app.put('/logout', isLoggedIn, logout);
  app.put('/password', isLoggedIn, updatePassword);
};

module.exports.isLoggedIn = isLoggedIn;
module.exports.sessionUser = sessionUser;

