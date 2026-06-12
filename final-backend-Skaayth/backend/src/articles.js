const { ObjectId } = require('mongodb');
const auth = require('./auth');
const uploadImage = require('./uploadCloudinary');
const isLoggedIn = auth.isLoggedIn;

async function getArticles(req, res) {
  const db = req.app.locals.db;
  const { id } = req.params;
  const username = req.username;
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  
  try {
    if (id) {
      if (ObjectId.isValid(id)) {
        // id is a valid ObjectId, try to find specific article
        const article = await db.collection('articles').findOne({ _id: new ObjectId(id) });
        
        if (!article) {
          return res.status(404).send({ error: 'Article not found' });
        }
        
        const responseArticle = {
          _id: article._id.toString(),
          pid: article._id.toString(),
          author: article.author,
          text: article.text,
          date: article.date,
          img: article.img || undefined,
          comments: article.comments || []
        };
        
        return res.send({ articles: [responseArticle] });
      } else {
        // id is not a valid ObjectId, assume it's a username
        const articles = await db.collection('articles')
          .find({ author: id })
          .sort({ date: -1 })
          .toArray();
        
        if (articles.length === 0) {
          return res.status(404).send({ error: 'Article not found' });
        }
        
        const responseArticles = articles.map(article => ({
          _id: article._id.toString(),
          pid: article._id.toString(),
          author: article.author,
          text: article.text,
          date: article.date,
          img: article.img || undefined,
          comments: article.comments || []
        }));
        
        return res.send({ articles: responseArticles });
      }
    } else {
      const profile = await db.collection('profiles').findOne({ username });
      const following = profile?.following || [];
      const usersToQuery = [username, ...following];
      
      const articles = await db.collection('articles')
        .find({ author: { $in: usersToQuery } })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      const responseArticles = articles.map(article => ({
        _id: article._id.toString(),
        pid: article._id.toString(),
        author: article.author,
        text: article.text,
        date: article.date,
        img: article.img || undefined,
        comments: article.comments || []
      }));
      
      res.send({ articles: responseArticles });
    }
  } catch (err) {
    console.error('Get articles error:', err);
    res.status(500).send({ error: 'Failed to get articles' });
  }
}

async function createArticle(req, res) {
  const db = req.app.locals.db;
  const { text } = req.body;
  const username = req.username;
  
  if (!text) {
    return res.status(400).send({ error: 'Missing text' });
  }
  
  try {
    const article = {
      author: username,
      text,
      date: new Date(),
      comments: []
    };
    
    if (req.fileurl) {
      article.img = req.fileurl;
    }
    
    const result = await db.collection('articles').insertOne(article);
    
    const responseArticle = {
      _id: result.insertedId.toString(),
      pid: result.insertedId.toString(),
      author: article.author,
      text: article.text,
      date: article.date,
      img: article.img || undefined,
      comments: article.comments
    };
    
    res.send({ articles: [responseArticle] });
  } catch (err) {
    console.error('Create article error:', err);
    res.status(500).send({ error: 'Failed to create article' });
  }
}

async function updateArticle(req, res) {
  const db = req.app.locals.db;
  const { id } = req.params;
  const { text, commentId } = req.body;
  const username = req.username;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).send({ error: 'Invalid article id' });
  }
  
  try {
    const article = await db.collection('articles').findOne({ _id: new ObjectId(id) });
    
    if (!article) {
      return res.status(404).send({ error: 'Article not found' });
    }
    
    if (commentId !== undefined) {
      if (commentId === -1) {
        if (!text) {
          return res.status(400).send({ error: 'Missing comment text' });
        }
        
        const newComment = {
          id: Date.now(),
          author: username,
          text: text,
          date: new Date()
        };
        
        await db.collection('articles').updateOne(
          { _id: new ObjectId(id) },
          { $push: { comments: newComment } }
        );
        
        const updatedArticle = await db.collection('articles').findOne({ _id: new ObjectId(id) });
        
        return res.send({
          articles: [{
            _id: updatedArticle._id.toString(),
            pid: updatedArticle._id.toString(),
            author: updatedArticle.author,
            text: updatedArticle.text,
            date: updatedArticle.date,
            img: updatedArticle.img || undefined,
            comments: updatedArticle.comments || []
          }]
        });
      } else {
        const comments = article.comments || [];
        const commentIndex = comments.findIndex(c => c.id == commentId);
        
        if (commentIndex === -1) {
          return res.status(404).send({ error: 'Comment not found' });
        }
        
        if (comments[commentIndex].author !== username) {
          return res.status(403).send({ error: 'Forbidden: You do not own this comment' });
        }
        
        if (!text) {
          return res.status(400).send({ error: 'Missing comment text' });
        }
        
        comments[commentIndex].text = text;
        
        await db.collection('articles').updateOne(
          { _id: new ObjectId(id) },
          { $set: { comments: comments } }
        );
        
        const updatedArticle = await db.collection('articles').findOne({ _id: new ObjectId(id) });
        
        return res.send({
          articles: [{
            _id: updatedArticle._id.toString(),
            pid: updatedArticle._id.toString(),
            author: updatedArticle.author,
            text: updatedArticle.text,
            date: updatedArticle.date,
            img: updatedArticle.img || undefined,
            comments: updatedArticle.comments || []
          }]
        });
      }
    } else {
      if (article.author !== username) {
        return res.status(403).send({ error: 'Forbidden: You do not own this article' });
      }
      
      if (!text) {
        return res.status(400).send({ error: 'Missing text' });
      }
      
      await db.collection('articles').updateOne(
        { _id: new ObjectId(id) },
        { $set: { text: text } }
      );
      
      const updatedArticle = await db.collection('articles').findOne({ _id: new ObjectId(id) });
      
      return res.send({
        articles: [{
          _id: updatedArticle._id.toString(),
          pid: updatedArticle._id.toString(),
          author: updatedArticle.author,
          text: updatedArticle.text,
          date: updatedArticle.date,
          img: updatedArticle.img || undefined,
          comments: updatedArticle.comments || []
        }]
      });
    }
  } catch (err) {
    console.error('Update article error:', err);
    res.status(500).send({ error: 'Failed to update article' });
  }
}

module.exports = (app) => {
  app.get('/articles/:id?', isLoggedIn, getArticles);
  app.post('/article', isLoggedIn, uploadImage('image'), createArticle);
  app.put('/articles/:id', isLoggedIn, updateArticle);
};
