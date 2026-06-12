import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import NavBar from '../components/NavBar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import * as api from '../services/api.js'

function PostCard({ post, onUpdate }) {
  const { user } = useAuth()
  const [comments, setComments] = useState(post.comments || [])
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editText, setEditText] = useState(post.text)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentText, setEditingCommentText] = useState('')

  const isOwner = user?.username === post.author

  const toggleComments = () => {
    setShowComments(!showComments)
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    
    try {
      const response = await api.addComment(post.pid, commentText)
      const updatedArticle = response.articles[0]
      setComments(updatedArticle.comments)
      setCommentText('')
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to add comment:', error)
      alert('Failed to add comment: ' + error.message)
    }
  }

  const handleEditArticle = async () => {
    if (!editText.trim()) return
    
    try {
      await api.updateArticle(post.pid, editText)
      setEditMode(false)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to edit article:', error)
      alert('Failed to edit article: ' + error.message)
    }
  }

  const handleEditComment = async (commentId) => {
    if (!editingCommentText.trim()) return
    
    try {
      const response = await api.updateComment(post.pid, commentId, editingCommentText)
      const updatedArticle = response.articles[0]
      setComments(updatedArticle.comments)
      setEditingCommentId(null)
      setEditingCommentText('')
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Failed to edit comment:', error)
      alert('Failed to edit comment: ' + error.message)
    }
  }

  const date = new Date(post.date)

  return (
    <div className="card shadow-sm mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div>
            <h6 className="mb-0 fw-bold text-primary">{post.author}</h6>
          </div>
          <div className="text-muted small">{date.toLocaleDateString()} {date.toLocaleTimeString()}</div>
        </div>
        
        {post.img && (
          <img className="img-fluid rounded mb-2" src={post.img} alt="post" style={{ maxWidth: '500px', maxHeight: '400px', objectFit: 'cover' }} />
        )}
        
        {editMode ? (
          <div className="mb-2">
            <textarea 
              className="form-control mb-2" 
              rows={3} 
              value={editText}
              onChange={e => setEditText(e.target.value)}
            />
            <button className="btn btn-primary btn-sm me-2" onClick={handleEditArticle}>Save</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
          </div>
        ) : (
          <p className="mb-2">{post.text}</p>
        )}
        
        <div className="d-flex gap-2 mb-2">
          {isOwner && !editMode && (
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditMode(true)}>
              <i className="bi bi-pencil"></i> Edit
            </button>
          )}
          <button className="btn btn-outline-secondary btn-sm" onClick={toggleComments}>
            <i className="bi bi-chat"></i> {showComments ? 'Hide' : 'Show'} Comments ({comments.length})
          </button>
        </div>
        
        {showComments && (
          <div className="border-top pt-2">
            <div className="mb-2">
              <textarea 
                className="form-control form-control-sm mb-2" 
                rows={2} 
                placeholder="Write a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" onClick={handleAddComment}>
                Add Comment
              </button>
            </div>
            
            {comments.length > 0 && (
              <div>
                <div className="small fw-semibold mb-2">Comments:</div>
                <div className="vstack gap-2">
                  {comments.map(comment => {
                    const isCommentOwner = user?.username === comment.author
                    const isEditing = editingCommentId === comment.id
                    
                    return (
                      <div key={comment.id} className="bg-light rounded p-2 small">
                        <div className="fw-semibold text-primary">{comment.author}</div>
                        {isEditing ? (
                          <div>
                            <textarea 
                              className="form-control form-control-sm mb-1" 
                              rows={2}
                              value={editingCommentText}
                              onChange={e => setEditingCommentText(e.target.value)}
                            />
                            <button 
                              className="btn btn-primary btn-sm me-1" 
                              onClick={() => handleEditComment(comment.id)}
                            >
                              Save
                            </button>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              onClick={() => {
                                setEditingCommentId(null)
                                setEditingCommentText('')
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div>{comment.text}</div>
                            {isCommentOwner && (
                              <button 
                                className="btn btn-link btn-sm p-0 text-decoration-none" 
                                onClick={() => {
                                  setEditingCommentId(comment.id)
                                  setEditingCommentText(comment.text)
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Main() {
  const { user, headline, setHeadline, updateHeadline, avatarUrl } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  // Handle OAuth callback - check for token in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    const username = params.get('username')
    
    if (token && username) {
      // Store token from OAuth callback
      localStorage.setItem('authToken', token)
      localStorage.setItem('loggedInUser', JSON.stringify({ username }))
      
      // Clean up URL (remove token from address bar)
      navigate('/main', { replace: true })
      
      // Reload page to update user state
      window.location.reload()
    }
  }, [location, navigate])

  // New article composer
  const [draft, setDraft] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Following sidebar
  const [following, setFollowing] = useState([])
  const [newFollowerName, setNewFollowerName] = useState('')
  const [followerError, setFollowerError] = useState('')

  // Load articles
  const loadArticles = async (pageNum = 1) => {
    try {
      const response = await api.fetchArticles(pageNum)
      const newArticles = response.articles || []
      
      if (pageNum === 1) {
        setArticles(newArticles)
      } else {
        setArticles(prev => [...prev, ...newArticles])
      }
      
      setHasMore(newArticles.length === 10)
    } catch (error) {
      console.error('Failed to load articles:', error)
    }
  }

  // Load following
  const loadFollowing = async () => {
    try {
      const response = await api.fetchFollowing()
      // Following is array of usernames, need to convert to user objects
      const usernames = response.following || []
      setFollowing(usernames.map(username => ({ username })))
    } catch (error) {
      console.error('Failed to load following:', error)
    }
  }

  useEffect(() => {
    if (user) {
      loadArticles(1)
      loadFollowing()
    }
  }, [user])

  const filtered = articles.filter(article => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      article.text.toLowerCase().includes(q) || 
      article.author.toLowerCase().includes(q)
    )
  })

  const publish = async () => {
    if (!draft.trim()) return
    
    try {
      await api.createArticle(draft, imageFile)
      setDraft('')
      setImageFile(null)
      setImagePreview(null)
      setPage(1)
      await loadArticles(1)
    } catch (error) {
      console.error('Failed to create article:', error)
      alert('Failed to create article: ' + error.message)
    }
  }

  const cancelDraft = () => {
    setDraft('')
    setImageFile(null)
    setImagePreview(null)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const addFollower = async () => {
    const name = newFollowerName.trim()
    if (!name) return
    
    setFollowerError('')
    
    try {
      await api.addFollowing(name)
      await loadFollowing()
      await loadArticles(1)
      setNewFollowerName('')
    } catch (error) {
      setFollowerError(error.message || 'Failed to add follower')
    }
  }

  const unfollow = async (username) => {
    try {
      await api.removeFollowing(username)
      await loadFollowing()
      await loadArticles(1)
    } catch (error) {
      console.error('Failed to unfollow:', error)
    }
  }

  const handleUpdateHeadline = async () => {
    const result = await updateHeadline(headline)
    if (!result.success) {
      alert('Failed to update headline: ' + result.error)
    }
  }

  const loadMoreArticles = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadArticles(nextPage)
  }

  if (!user) return null

  return (
    <>
      <NavBar />
      <div className="container py-3">
        <div className="row g-3">
          {/* Left: Feed */}
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm mb-3">
              <div className="card-body">
                <div className="mb-3 p-4 bg-light rounded">
                  <div className="mb-3">
                    <h3 className="mb-2">{user.username}</h3>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <span className="badge bg-primary fs-6">Status:</span>
                      <span className="fs-5 fw-medium">{headline || 'No status yet'}</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <img src={avatarUrl} width="100" height="100" className="rounded-2 border border-3 border-primary" alt="avatar" style={{ objectFit: 'cover' }} />
                  </div>
                  
                  <div className="input-group input-group-lg">
                    <input 
                      className="form-control" 
                      value={headline} 
                      onChange={e=>setHeadline(e.target.value)} 
                      placeholder="Update your status headline" 
                    />
                    <button className="btn btn-primary" onClick={handleUpdateHeadline}>
                      Update Status
                    </button>
                  </div>
                </div>
                <div className="input-group mb-2">
                  <span className="input-group-text"><i className="bi bi-search"/></span>
                  <input 
                    className="form-control" 
                    placeholder="Search by author or text" 
                    value={search} 
                    onChange={e=>setSearch(e.target.value)} 
                  />
                </div>
                <div className="mb-3">
                  <textarea 
                    className="form-control" 
                    rows={3} 
                    placeholder="Write a new article..." 
                    value={draft} 
                    onChange={e=>setDraft(e.target.value)} 
                  />
                  {imagePreview && (
                    <div className="mt-2 position-relative" style={{ maxWidth: '200px' }}>
                      <img src={imagePreview} className="img-fluid rounded" alt="preview" />
                      <button 
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview(null)
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <div className="d-flex gap-2 mt-2">
                    <button className="btn btn-success" onClick={publish}>Post</button>
                    <button className="btn btn-outline-secondary" onClick={cancelDraft}>Cancel</button>
                    <label className="btn btn-outline-dark mb-0">
                      <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                      <i className="bi bi-image"></i> Upload image
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {filtered.map((article) => (
              <PostCard key={article.pid} post={article} onUpdate={() => loadArticles(1)} />
            ))}
            
            {!search && hasMore && articles.length > 0 && (
              <div className="text-center my-3">
                <button className="btn btn-outline-primary" onClick={loadMoreArticles}>
                  Load More Articles
                </button>
              </div>
            )}
            
            {articles.length === 0 && (
              <div className="text-center text-muted py-5">
                <p>No articles yet. Create your first post above or follow some users!</p>
              </div>
            )}
          </div>

          {/* Right: Following */}
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Following</h6>
                  <Link to="/profile" className="btn btn-sm btn-outline-primary">Profile</Link>
                </div>
                <div className="input-group mb-2">
                  <input 
                    className="form-control" 
                    placeholder="Add follower by username" 
                    value={newFollowerName} 
                    onChange={e=>setNewFollowerName(e.target.value)} 
                  />
                  <button className="btn btn-outline-success" onClick={addFollower}>Add</button>
                </div>
                {followerError && <div className="alert alert-danger py-1 small mb-2">{followerError}</div>}
                <div className="vstack gap-2">
                  {following.map(f => (
                    <div key={f.username} className="d-flex align-items-center justify-content-between border rounded p-2">
                      <div className="fw-semibold">{f.username}</div>
                      <button className="btn btn-sm btn-outline-danger" onClick={()=>unfollow(f.username)}>Unfollow</button>
                    </div>
                  ))}
                  {following.length === 0 && (
                    <div className="text-muted small">No followed users yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
