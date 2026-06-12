import NavBar from '../components/NavBar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import * as api from '../services/api.js'

export default function Profile() {
  const { user, avatarUrl, updateAvatar } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [values, setValues] = useState({
    username: user?.username || '',
    email: '',
    phone: '',
    zipcode: '',
    dob: '',
    password: ''
  })
  const [errs, setErrs] = useState({})
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [linkedAccounts, setLinkedAccounts] = useState([])
  const [isOAuthUser, setIsOAuthUser] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkUsername, setLinkUsername] = useState('')
  const [linkPassword, setLinkPassword] = useState('')
  
  // Handle OAuth callback for linking
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const linked = params.get('linked')
    const token = params.get('token')
    const username = params.get('username')
    
    if (linked === 'success' && token && username) {
      // Store token from OAuth linking callback
      localStorage.setItem('authToken', token)
      localStorage.setItem('loggedInUser', JSON.stringify({ username }))
      
      // Show success message
      alert('Accounts linked successfully! You can now login with Google.')
      
      // Clean up URL
      navigate('/profile', { replace: true })
      
      // Reload to update state
      window.location.reload()
    }
  }, [location, navigate])

  useEffect(() => {
    if (user) {
      // Load profile data
      Promise.all([
        api.fetchEmail().catch(() => ({ email: '' })),
        api.fetchPhone().catch(() => ({ phone: '' })),
        api.fetchZipcode().catch(() => ({ zipcode: '' })),
        api.getLinkedAccounts().catch(() => ({ linkedProviders: [], isOAuthUser: false }))
      ]).then(([emailData, phoneData, zipcodeData, accountData]) => {
        setValues(v => ({
          ...v,
          email: emailData.email || '',
          phone: phoneData.phone || '',
          zipcode: zipcodeData.zipcode || ''
        }))
        setLinkedAccounts(accountData.linkedProviders || [])
        setIsOAuthUser(accountData.isOAuthUser || false)
      })
    }
  }, [user])

  const onUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setUploadingAvatar(true)
    const result = await updateAvatar(file)
    setUploadingAvatar(false)
    
    if (result.success) {
      alert('Avatar updated successfully!')
    } else {
      alert('Failed to update avatar: ' + result.error)
    }
  }

  function validate(v) {
    const e = {}
    if (v.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) e.email = 'Invalid email'
    if (v.phone && !/^\+?[-.\d\s]{7,}$/.test(v.phone)) e.phone = 'Invalid phone'
    if (v.zipcode && !/^\d{5}(-\d{4})?$/.test(v.zipcode)) e.zipcode = 'Invalid ZIP'
    return e
  }

  const update = async (e) => {
    e.preventDefault()
    const e2 = validate(values)
    setErrs(e2)
    
    if (Object.keys(e2).length === 0) {
      try {
        const updates = []
        if (values.email) updates.push(api.updateEmail(values.email))
        if (values.phone) updates.push(api.updatePhone(values.phone))
        if (values.zipcode) updates.push(api.updateZipcode(values.zipcode))
        if (values.password) updates.push(api.updatePassword(values.password))
        
        await Promise.all(updates)
        alert('Profile updated successfully!')
        setValues(v => ({ ...v, password: '' }))
      } catch (error) {
        alert('Failed to update profile: ' + error.message)
      }
    }
  }

  const unlinkAccount = async (provider) => {
    if (!confirm(`Are you sure you want to unlink your ${provider} account?`)) return
    
    try {
      await api.unlinkProvider(provider)
      alert(`${provider} account unlinked successfully!`)
      // Reload linked accounts
      const accountData = await api.getLinkedAccounts()
      setLinkedAccounts(accountData.linkedProviders || [])
    } catch (error) {
      alert('Failed to unlink account: ' + error.message)
    }
  }

  const handleLinkAccount = () => {
    if (isOAuthUser) {
      // OAuth user linking to password account
      setShowLinkModal(true)
    } else {
      // Password user linking to Google OAuth
      alert('Note: After linking, you can use both password and Google to login. Your username will remain ' + user.username)
      const confirmLink = confirm('You will be redirected to Google to link your account. Continue?')
      if (confirmLink) {
        // Redirect to OAuth with linking parameters
        window.location.href = `${api.API_URL}/auth/google?linking=true&linkingUsername=${encodeURIComponent(user.username)}`
      }
    }
  }

  const submitLinkPassword = async () => {
    if (!linkUsername.trim() || !linkPassword.trim()) {
      alert('Please enter both username and password')
      return
    }

    try {
      await api.linkPasswordAccount(linkUsername, linkPassword)
      alert('Accounts linked successfully!')
      setShowLinkModal(false)
      setLinkUsername('')
      setLinkPassword('')
      // Reload linked accounts
      const accountData = await api.getLinkedAccounts()
      setLinkedAccounts(accountData.linkedProviders || [])
      setIsOAuthUser(accountData.isOAuthUser || false)
    } catch (error) {
      alert('Failed to link account: ' + error.message)
    }
  }

  if (!user) return null

  return (
    <>
      <NavBar />
      <div className="container py-3">
        <div className="row justify-content-center">
          <div className="col-12 col-md-10 col-lg-8">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="position-relative">
                    <img src={avatarUrl} width="72" height="72" className="rounded-2" alt="avatar" style={{ objectFit: 'cover' }} />
                    {uploadingAvatar && (
                      <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50 rounded-2">
                        <div className="spinner-border spinner-border-sm text-light" role="status">
                          <span className="visually-hidden">Uploading...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="fw-bold">{values.username}</div>
                    {isOAuthUser && (
                      <span className="badge bg-info-subtle text-dark border mb-1">
                        <i className="bi bi-google"></i> OAuth User
                      </span>
                    )}
                    <label className="btn btn-sm btn-outline-dark mt-1 mb-0 d-block">
                      <input type="file" hidden accept="image/*" onChange={onUpload} disabled={uploadingAvatar} />
                      {uploadingAvatar ? 'Uploading...' : 'Upload new picture'}
                    </label>
                  </div>
                </div>

                {/* Link Account Button */}
                <div className="alert alert-warning mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong><i className="bi bi-link-45deg"></i> Account Linking</strong>
                      <p className="mb-0 small">
                        {isOAuthUser 
                          ? 'Link your Google account to an existing password account'
                          : 'Link your account to Google for easier sign-in'}
                      </p>
                    </div>
                    <button className="btn btn-primary" onClick={handleLinkAccount}>
                      <i className="bi bi-plus-circle"></i> Link Account
                    </button>
                  </div>
                </div>

                {linkedAccounts.length > 0 && (
                  <div className="alert alert-success mb-3">
                    <strong><i className="bi bi-check-circle"></i> Linked Accounts:</strong>
                    <div className="mt-2">
                      {linkedAccounts.map(account => (
                        <div key={account.provider} className="d-flex align-items-center justify-content-between mb-1">
                          <span>
                            <i className="bi bi-link-45deg"></i> {account.provider}
                          </span>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => unlinkAccount(account.provider)}
                          >
                            Unlink
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal for linking password account (when logged in via OAuth) */}
                {showLinkModal && (
                  <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">Link to Password Account</h5>
                          <button type="button" className="btn-close" onClick={() => setShowLinkModal(false)}></button>
                        </div>
                        <div className="modal-body">
                          <p>Enter the username and password of your existing account to link it with your Google account.</p>
                          <div className="mb-3">
                            <label className="form-label">Username</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={linkUsername}
                              onChange={e => setLinkUsername(e.target.value)}
                              placeholder="Enter username"
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Password</label>
                            <input 
                              type="password" 
                              className="form-control" 
                              value={linkPassword}
                              onChange={e => setLinkPassword(e.target.value)}
                              placeholder="Enter password"
                            />
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn btn-secondary" onClick={() => setShowLinkModal(false)}>
                            Cancel
                          </button>
                          <button type="button" className="btn btn-primary" onClick={submitLinkPassword}>
                            Link Accounts
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <form className="row g-3" onSubmit={update}>
                  <div className="col-md-6">
                    <label className="form-label">Username</label>
                    <input className="form-control" value={values.username} disabled readOnly />
                    <div className="form-text">Username cannot be changed</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input 
                      className={`form-control ${errs.email?'is-invalid':''}`} 
                      value={values.email} 
                      onChange={e=>setValues(v=>({...v,email:e.target.value}))} 
                    />
                    {errs.email && <div className="invalid-feedback">{errs.email}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input 
                      className={`form-control ${errs.phone?'is-invalid':''}`} 
                      value={values.phone} 
                      onChange={e=>setValues(v=>({...v,phone:e.target.value}))} 
                    />
                    {errs.phone && <div className="invalid-feedback">{errs.phone}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Zipcode</label>
                    <input 
                      className={`form-control ${errs.zipcode?'is-invalid':''}`} 
                      value={values.zipcode} 
                      onChange={e=>setValues(v=>({...v,zipcode:e.target.value}))} 
                    />
                    {errs.zipcode && <div className="invalid-feedback">{errs.zipcode}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Date of Birth</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={values.dob} 
                      disabled 
                      readOnly 
                    />
                    <div className="form-text">DOB cannot be changed</div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={values.password} 
                      onChange={e=>setValues(v=>({...v,password:e.target.value}))} 
                      placeholder="Enter new password" 
                    />
                    <div className="form-text">Leave blank to keep unchanged</div>
                  </div>
                  <div className="col-12 d-flex gap-2">
                    <button className="btn btn-primary" type="submit">Update Profile</button>
                    <Link to="/main" className="btn btn-outline-secondary">Back to Main</Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
