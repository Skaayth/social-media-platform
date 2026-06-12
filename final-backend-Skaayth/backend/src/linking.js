const md5 = require('md5');
const auth = require('./auth');
const isLoggedIn = auth.isLoggedIn;

function getHash(password, salt) {
  return md5(password + salt);
}

// Link a password account to currently logged in OAuth account
async function linkPasswordAccount(req, res) {
  const db = req.app.locals.db;
  const currentUsername = req.username;
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).send({ error: 'Missing username or password' });
  }
  
  try {
    const currentUser = await db.collection('users').findOne({ username: currentUsername });
    
    if (!currentUser || !currentUser.auth) {
      return res.status(400).send({ error: 'Current user is not an OAuth user' });
    }
    
    const passwordUser = await db.collection('users').findOne({ username });
    
    if (!passwordUser) {
      return res.status(404).send({ error: 'Password account not found' });
    }
    
    if (passwordUser.auth) {
      return res.status(400).send({ error: 'Cannot link to another OAuth account' });
    }
    
    const hash = getHash(password, passwordUser.salt);
    if (hash !== passwordUser.hash) {
      return res.status(401).send({ error: 'Invalid password' });
    }
    
    const passwordProfile = await db.collection('profiles').findOne({ username });
    const oauthProfile = await db.collection('profiles').findOne({ username: currentUsername });
    
    const mergedFollowing = [...new Set([
      ...(passwordProfile?.following || []),
      ...(oauthProfile?.following || [])
    ])];
    
    const authProviders = passwordUser.authProviders || [];
    authProviders.push(currentUser.auth);
    
    await db.collection('users').updateOne(
      { username },
      { 
        $set: { 
          authProviders: authProviders,
          email: currentUser.email || passwordUser.email
        } 
      }
    );
    
    await db.collection('profiles').updateOne(
      { username },
      { $set: { following: mergedFollowing } }
    );
    
    // Update articles from OAuth account to password account
    await db.collection('articles').updateMany(
      { author: currentUsername },
      { $set: { author: username } }
    );
    
    await db.collection('users').deleteOne({ username: currentUsername });
    await db.collection('profiles').deleteOne({ username: currentUsername });
    
    res.send({ 
      result: 'success', 
      username,
      message: 'Accounts linked successfully',
      linkedProviders: authProviders.map(p => p.provider)
    });
    
  } catch (err) {
    console.error('Link password account error:', err);
    res.status(500).send({ error: 'Failed to link accounts' });
  }
}

// Link an OAuth account to currently logged in password account
async function linkOAuthAccount(req, res) {
  const db = req.app.locals.db;
  const currentUsername = req.username;
  const { oauthUsername } = req.body;
  
  if (!oauthUsername) {
    return res.status(400).send({ error: 'Missing OAuth username' });
  }
  
  try {
    // Get current user (should be password user)
    const currentUser = await db.collection('users').findOne({ username: currentUsername });
    
    if (!currentUser || currentUser.auth) {
      return res.status(400).send({ error: 'Current user is already an OAuth user' });
    }
    
    // Find the OAuth account to link
    const oauthUser = await db.collection('users').findOne({ username: oauthUsername });
    
    if (!oauthUser || !oauthUser.auth) {
      return res.status(404).send({ error: 'OAuth account not found' });
    }
    
    // Merge accounts: Keep password account, add OAuth info
    const passwordProfile = await db.collection('profiles').findOne({ username: currentUsername });
    const oauthProfile = await db.collection('profiles').findOne({ username: oauthUsername });
    
    // Merge following lists (remove duplicates)
    const mergedFollowing = [...new Set([
      ...(passwordProfile?.following || []),
      ...(oauthProfile?.following || [])
    ])];
    
    // Add OAuth provider to password account
    const authProviders = currentUser.authProviders || [];
    authProviders.push(oauthUser.auth);
    
    await db.collection('users').updateOne(
      { username: currentUsername },
      { 
        $set: { 
          authProviders: authProviders,
          email: oauthUser.email || currentUser.email
        } 
      }
    );
    
    await db.collection('profiles').updateOne(
      { username: currentUsername },
      { $set: { following: mergedFollowing } }
    );
    
    // Update articles from OAuth account to password account
    await db.collection('articles').updateMany(
      { author: oauthUsername },
      { $set: { author: currentUsername } }
    );
    
    // Delete OAuth user and profile
    await db.collection('users').deleteOne({ username: oauthUsername });
    await db.collection('profiles').deleteOne({ username: oauthUsername });
    
    res.send({ 
      result: 'success', 
      username: currentUsername,
      message: 'OAuth account linked successfully',
      linkedProviders: authProviders.map(p => p.provider)
    });
    
  } catch (err) {
    console.error('Link OAuth account error:', err);
    res.status(500).send({ error: 'Failed to link accounts' });
  }
}

// Unlink an OAuth provider from account
async function unlinkProvider(req, res) {
  const db = req.app.locals.db;
  const username = req.username;
  const { provider } = req.params;
  
  if (!provider) {
    return res.status(400).send({ error: 'Missing provider' });
  }
  
  try {
    const user = await db.collection('users').findOne({ username });
    
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    
    // Check if user has linked providers
    if (!user.authProviders || user.authProviders.length === 0) {
      return res.status(400).send({ error: 'No linked OAuth providers' });
    }
    
    // Remove the specified provider
    const updatedProviders = user.authProviders.filter(p => p.provider !== provider);
    
    if (updatedProviders.length === user.authProviders.length) {
      return res.status(404).send({ error: 'Provider not found in linked accounts' });
    }
    
    await db.collection('users').updateOne(
      { username },
      { $set: { authProviders: updatedProviders } }
    );
    
    res.send({ 
      result: 'success', 
      username,
      message: `${provider} account unlinked`,
      linkedProviders: updatedProviders.map(p => p.provider)
    });
    
  } catch (err) {
    console.error('Unlink provider error:', err);
    res.status(500).send({ error: 'Failed to unlink provider' });
  }
}

// Get linked accounts for current user
async function getLinkedAccounts(req, res) {
  const db = req.app.locals.db;
  const username = req.username;
  
  try {
    const user = await db.collection('users').findOne({ username });
    
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    
    const linkedProviders = user.authProviders || [];
    const isOAuthUser = !!user.auth;
    
    res.send({ 
      username,
      isOAuthUser,
      primaryProvider: user.auth?.provider || 'password',
      linkedProviders: linkedProviders.map(p => ({
        provider: p.provider,
        providerId: p.providerId
      }))
    });
    
  } catch (err) {
    console.error('Get linked accounts error:', err);
    res.status(500).send({ error: 'Failed to get linked accounts' });
  }
}

module.exports = (app) => {
  app.post('/link/password', isLoggedIn, linkPasswordAccount);
  app.post('/link/oauth', isLoggedIn, linkOAuthAccount);
  app.delete('/link/:provider', isLoggedIn, unlinkProvider);
  app.get('/link/accounts', isLoggedIn, getLinkedAccounts);
};

