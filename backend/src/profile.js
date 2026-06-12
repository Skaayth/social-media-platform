const auth = require('./auth');
const uploadImage = require('./uploadCloudinary');
const isLoggedIn = auth.isLoggedIn;

async function getHeadline(req, res) {
  const db = req.app.locals.db;
  const { user } = req.params;
  const username = user || req.username;
  
  try {
    const profile = await db.collection('profiles').findOne({ username });
    
    if (!profile) {
      return res.status(404).send({ error: 'User not found' });
    }
    
    res.send({ username, headline: profile.headline || 'This is my headline!' });
  } catch (err) {
    console.error('Get headline error:', err);
    res.status(500).send({ error: 'Failed to get headline' });
  }
}

async function updateHeadline(req, res) {
  const db = req.app.locals.db;
  const { headline } = req.body;
  const username = req.username;
  
  if (!headline) {
    return res.status(400).send({ error: 'Missing headline' });
  }
  
  try {
    await db.collection('profiles').updateOne(
      { username },
      { $set: { headline } }
    );
    
    res.send({ username, headline });
  } catch (err) {
    console.error('Update headline error:', err);
    res.status(500).send({ error: 'Failed to update headline' });
  }
}

async function getDisplay(req, res) {
  const db = req.app.locals.db;
  const { user } = req.params;
  const username = user || req.username;
  
  try {
    const profile = await db.collection('profiles').findOne({ username });
    const display = profile?.display || username;
    res.send({ username, display });
  } catch (err) {
    res.send({ username, display: username });
  }
}

async function updateDisplay(req, res) {
  const db = req.app.locals.db;
  const { display } = req.body;
  const username = req.username;
  
  try {
    await db.collection('profiles').updateOne(
      { username },
      { $set: { display: display || username } }
    );
    res.send({ username, display: display || username });
  } catch (err) {
    res.send({ username, display: display || username });
  }
}

async function getEmail(req, res) {
  const db = req.app.locals.db;
  const { user } = req.params;
  const username = user || req.username;
  
  try {
    const profile = await db.collection('profiles').findOne({ username });
    const email = profile?.email || 'foo@bar.com';
    res.send({ username, email });
  } catch (err) {
    res.send({ username, email: 'foo@bar.com' });
  }
}

async function updateEmail(req, res) {
  const db = req.app.locals.db;
  const { email } = req.body;
  const username = req.username;
  
  try {
    await db.collection('profiles').updateOne(
      { username },
      { $set: { email: email || 'foo@bar.com' } }
    );
    res.send({ username, email: email || 'foo@bar.com' });
  } catch (err) {
    res.send({ username, email: email || 'foo@bar.com' });
  }
}

async function getZipcode(req, res) {
  const db = req.app.locals.db;
  const { user } = req.params;
  const username = user || req.username;
  
  try {
    const profile = await db.collection('profiles').findOne({ username });
    const zipcode = profile?.zipcode || 12345;
    res.send({ username, zipcode });
  } catch (err) {
    res.send({ username, zipcode: 12345 });
  }
}

async function updateZipcode(req, res) {
  const db = req.app.locals.db;
  const { zipcode } = req.body;
  const username = req.username;
  
  try {
    await db.collection('profiles').updateOne(
      { username },
      { $set: { zipcode: zipcode || 12345 } }
    );
    res.send({ username, zipcode: zipcode || 12345 });
  } catch (err) {
    res.send({ username, zipcode: zipcode || 12345 });
  }
}

async function getPhone(req, res) {
  const db = req.app.locals.db;
  const { user } = req.params;
  const username = user || req.username;
  
  try {
    const profile = await db.collection('profiles').findOne({ username });
    const phone = profile?.phone || '123-456-7890';
    res.send({ username, phone });
  } catch (err) {
    res.send({ username, phone: '123-456-7890' });
  }
}

async function updatePhone(req, res) {
  const db = req.app.locals.db;
  const { phone } = req.body;
  const username = req.username;
  
  try {
    await db.collection('profiles').updateOne(
      { username },
      { $set: { phone: phone || '123-456-7890' } }
    );
    res.send({ username, phone: phone || '123-456-7890' });
  } catch (err) {
    res.send({ username, phone: phone || '123-456-7890' });
  }
}

async function getDob(req, res) {
  const db = req.app.locals.db;
  const { user } = req.params;
  const username = user || req.username;
  
  try {
    const profile = await db.collection('profiles').findOne({ username });
    const dob = profile?.dob || '128999122000';
    res.send({ username, dob });
  } catch (err) {
    res.send({ username, dob: '128999122000' });
  }
}

async function getAvatar(req, res) {
  const db = req.app.locals.db;
  const { user } = req.params;
  const username = user || req.username;
  
  try {
    const profile = await db.collection('profiles').findOne({ username });
    const avatar = profile?.avatar || 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/RDesRoches.jpg/220px-RDesRoches.jpg';
    res.send({ username, avatar });
  } catch (err) {
    res.send({ username, avatar: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/RDesRoches.jpg/220px-RDesRoches.jpg' });
  }
}

async function updateAvatar(req, res) {
  const db = req.app.locals.db;
  const username = req.username;
  
  // Check if an image was uploaded
  if (!req.fileurl) {
    return res.status(400).send({ error: 'No image uploaded' });
  }
  
  try {
    // Update the avatar URL in the database
    await db.collection('profiles').updateOne(
      { username },
      { $set: { avatar: req.fileurl } }
    );
    
    res.send({ username, avatar: req.fileurl });
  } catch (err) {
    console.error('Update avatar error:', err);
    res.status(500).send({ error: 'Failed to update avatar' });
  }
}

module.exports = (app) => {
  app.get('/headline/:user?', isLoggedIn, getHeadline);
  app.put('/headline', isLoggedIn, updateHeadline);
  app.get('/display/:user?', isLoggedIn, getDisplay);
  app.put('/display', isLoggedIn, updateDisplay);
  app.get('/email/:user?', isLoggedIn, getEmail);
  app.put('/email', isLoggedIn, updateEmail);
  app.get('/zipcode/:user?', isLoggedIn, getZipcode);
  app.put('/zipcode', isLoggedIn, updateZipcode);
  app.get('/phone/:user?', isLoggedIn, getPhone);
  app.put('/phone', isLoggedIn, updatePhone);
  app.get('/dob/:user?', isLoggedIn, getDob);
  app.get('/avatar/:user?', isLoggedIn, getAvatar);
  app.put('/avatar', isLoggedIn, uploadImage('avatar'), updateAvatar);
};
