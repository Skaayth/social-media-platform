const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const md5 = require('md5');

const cookieKey = 'sid';
const mySecretMessage = 'ricebook-secret-key-2024';

// Import session management from auth.js
const sessionUser = require('./auth').sessionUser;

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      // Extract user info from Google profile
      const googleId = profile.id;
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const displayName = profile.displayName || profile.username || email?.split('@')[0];
      const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : undefined;
      
      const user = {
        googleId,
        email,
        displayName,
        avatar,
        accessToken
      };
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

async function findOrCreateOAuthUser(db, profile) {
  const { googleId, email, displayName, avatar } = profile;
  const oauthUsername = `google_${googleId}`;
  
  try {
    let user = await db.collection('users').findOne({ 
      'auth.provider': 'google',
      'auth.providerId': googleId 
    });
    
    if (user) {
      return user.username;
    }
    
    user = await db.collection('users').findOne({
      'authProviders.provider': 'google',
      'authProviders.providerId': googleId
    });
    
    if (user) {
      return user.username;
    }
    
    if (email) {
      user = await db.collection('users').findOne({ email });
      if (user && !user.auth) {
        // Could link later
      }
    }
    
    await db.collection('users').insertOne({
      username: oauthUsername,
      email: email || '',
      auth: {
        provider: 'google',
        providerId: googleId
      },
      createdAt: new Date()
    });
    
    await db.collection('profiles').insertOne({
      username: oauthUsername,
      display: displayName || oauthUsername,
      headline: 'New user via Google!',
      email: email || '',
      zipcode: '',
      phone: '',
      dob: '',
      avatar: avatar || 'https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/RDesRoches.jpg/220px-RDesRoches.jpg',
      following: []
    });
    
    return oauthUsername;
    
  } catch (error) {
    console.error('Error finding/creating OAuth user:', error);
    throw error;
  }
}

module.exports = (app) => {
  app.use(passport.initialize());
  
  app.get('/auth/google', (req, res, next) => {
    const state = {
      linking: req.query.linking || 'false',
      linkingUsername: req.query.linkingUsername || ''
    };
    
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      session: false,
      state: JSON.stringify(state)
    })(req, res, next);
  });
  
  app.get('/auth/google/callback',
    passport.authenticate('google', { 
      session: false,
      failureRedirect: process.env.FRONTEND_URL || 'https://sakethbook.surge.sh'
    }),
    async (req, res) => {
      try {
        const db = req.app.locals.db;
        
        if (!db) {
          return res.status(500).send('Database connection not available');
        }
        
        let linkingIntent = 'false';
        let linkingUsername = '';
        
        try {
          if (req.query.state) {
            const state = JSON.parse(req.query.state);
            linkingIntent = state.linking;
            linkingUsername = state.linkingUsername;
          }
        } catch (e) {
          // Continue as normal login
        }
        
        let username;
        
        if (linkingIntent === 'true' && linkingUsername) {
          const { googleId } = req.user;
          const passwordUser = await db.collection('users').findOne({ username: linkingUsername });
          
          if (passwordUser && !passwordUser.auth) {
            const authProviders = passwordUser.authProviders || [];
            authProviders.push({
              provider: 'google',
              providerId: googleId
            });
            
            await db.collection('users').updateOne(
              { username: linkingUsername },
              { $set: { authProviders: authProviders } }
            );
            
            username = linkingUsername;
          } else {
            username = await findOrCreateOAuthUser(db, req.user);
          }
        } else {
          username = await findOrCreateOAuthUser(db, req.user);
        }
        
        const sessionKey = md5(mySecretMessage + new Date().getTime() + username);
        sessionUser[sessionKey] = { username };
        
        res.cookie(cookieKey, sessionKey, {
          maxAge: 3600 * 1000,
          path: '/',
          httpOnly: true,
          sameSite: 'None',
          secure: true
        });
        
        const frontendUrl = process.env.FRONTEND_URL || 'https://sakethbook.surge.sh';
        const redirectUrl = linkingIntent === 'true' 
          ? `${frontendUrl}/profile?linked=success&token=${sessionKey}&username=${encodeURIComponent(username)}`
          : `${frontendUrl}/main?token=${sessionKey}&username=${encodeURIComponent(username)}`;
        
        res.redirect(redirectUrl);
        
      } catch (error) {
        console.error('OAuth callback error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'https://sakethbook.surge.sh';
        res.redirect(`${frontendUrl}/?error=oauth_failed`);
      }
    }
  );
  
  app.get('/auth/status', (req, res) => {
    const sessionId = req.cookies[cookieKey];
    if (sessionId && sessionUser[sessionId]) {
      res.send({ 
        loggedIn: true, 
        username: sessionUser[sessionId].username 
      });
    } else {
      res.send({ loggedIn: false });
    }
  });
};

module.exports.findOrCreateOAuthUser = findOrCreateOAuthUser;

