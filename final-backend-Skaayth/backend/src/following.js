const auth = require('./auth');
const isLoggedIn = auth.isLoggedIn;

async function getFollowing(req, res) {
  const db = req.app.locals.db;
  const { user } = req.params;
  const username = user || req.username;
  
  try {
    const profile = await db.collection('profiles').findOne({ username });
    const following = profile?.following || [];
    res.send({ username, following });
  } catch (err) {
    res.send({ username, following: [] });
  }
}

async function addFollowing(req, res) {
  const db = req.app.locals.db;
  const { user } = req.params;
  const username = req.username;
  
  try {
    const profile = await db.collection('profiles').findOne({ username });
    const following = profile?.following || [];
    if (!following.includes(user)) {
      following.push(user);
      await db.collection('profiles').updateOne(
        { username },
        { $set: { following } }
      );
    }
    res.send({ username, following });
  } catch (err) {
    res.send({ username, following: [] });
  }
}

async function removeFollowing(req, res) {
  const db = req.app.locals.db;
  const { user } = req.params;
  const username = req.username;
  
  try {
    const profile = await db.collection('profiles').findOne({ username });
    let following = profile?.following || [];
    following = following.filter(f => f !== user);
    await db.collection('profiles').updateOne(
      { username },
      { $set: { following } }
    );
    res.send({ username, following });
  } catch (err) {
    res.send({ username, following: [] });
  }
}

module.exports = (app) => {
  app.get('/following/:user?', isLoggedIn, getFollowing);
  app.put('/following/:user', isLoggedIn, addFollowing);
  app.delete('/following/:user', isLoggedIn, removeFollowing);
};

