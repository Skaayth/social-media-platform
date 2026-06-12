import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import NavBar from '../components/NavBar.jsx'
import { initiateGoogleLogin } from '../services/api.js'

export default function Landing() {
  const { login, register } = useAuth()
  const nav = useNavigate()

  // Login form
  const [acc, setAcc] = useState('')
  const [pwd, setPwd] = useState('')
  const [loginErr, setLoginErr] = useState('')

  const tryLogin = async (e) => {
    e.preventDefault()
    setLoginErr('')
    
    if (!acc.trim() || !pwd.trim()) {
      setLoginErr('Please enter both username and password')
      return
    }
    
    const result = await login(acc.trim(), pwd.trim())
    
    if (result.success) {
      nav('/main')
    } else {
      setLoginErr(result.error || 'Login failed')
    }
  }

  // Registration
  const [reg, setReg] = useState({ 
    username: '', 
    email: '', 
    phone: '', 
    zipcode: '', 
    dob: '',
    password: '', 
    confirm: '' 
  })
  const [regErrs, setRegErrs] = useState({})

  function validateReg(values) {
    const errs = {}
    if (!values.username.trim()) {
      errs.username = 'Required'
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
      errs.email = 'Invalid email'
    }
    if (!/^\d{5}(-\d{4})?$/.test(values.zipcode)) {
      errs.zipcode = 'Use 5 or 9 digit ZIP'
    }
    if (!/^\+?[-.\d\s]{7,}$/.test(values.phone)) {
      errs.phone = 'Invalid phone'
    }
    if (values.password.length < 6) {
      errs.password = '6+ chars'
    }
    if (values.password !== values.confirm) {
      errs.confirm = 'Passwords do not match'
    }
    return errs
  }

  const submitReg = async (e) => {
    e.preventDefault()
    const errs = validateReg(reg)
    setRegErrs(errs)
    
    if (Object.keys(errs).length === 0) {
      const result = await register({
        username: reg.username,
        email: reg.email,
        phone: reg.phone,
        zipcode: reg.zipcode,
        dob: reg.dob,
        password: reg.password
      })
      
      if (result.success) {
        nav('/main')
      } else {
        setRegErrs({ general: result.error || 'Registration failed' })
      }
    }
  }

  return (
    <>
      <NavBar />
      <div className="container py-4">
        <div className="row g-4">
          {/* Login */}
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Log in</h5>
                <form onSubmit={tryLogin} className="vstack gap-3">
                  <div>
                    <label className="form-label">Username</label>
                    <input 
                      className="form-control" 
                      value={acc} 
                      onChange={e=>setAcc(e.target.value)} 
                      placeholder="Enter your username" 
                    />
                  </div>
                  <div>
                    <label className="form-label">Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={pwd} 
                      onChange={e=>setPwd(e.target.value)} 
                      placeholder="Enter your password" 
                    />
                  </div>
                  {loginErr && <div className="alert alert-danger py-2">{loginErr}</div>}
                  <button className="btn btn-primary" type="submit">Log in</button>
                  
                  <div className="text-center my-2">
                    <span className="text-muted">— or —</span>
                  </div>
                  
                  <button 
                    type="button"
                    className="btn btn-outline-danger d-flex align-items-center justify-content-center gap-2" 
                    onClick={initiateGoogleLogin}
                  >
                    <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                    Login with Google
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Registration */}
          <div className="col-12 col-lg-7">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Register</h5>
                <form onSubmit={submitReg} className="row g-3">
                  {regErrs.general && (
                    <div className="col-12">
                      <div className="alert alert-danger py-2">{regErrs.general}</div>
                    </div>
                  )}
                  <div className="col-md-6">
                    <label className="form-label">Username</label>
                    <input 
                      className={`form-control ${regErrs.username?'is-invalid':''}`} 
                      value={reg.username} 
                      onChange={e=>setReg(v=>({...v,username:e.target.value}))} 
                    />
                    {regErrs.username && <div className="invalid-feedback">{regErrs.username}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input 
                      type="email"
                      className={`form-control ${regErrs.email?'is-invalid':''}`} 
                      value={reg.email} 
                      onChange={e=>setReg(v=>({...v,email:e.target.value}))} 
                    />
                    {regErrs.email && <div className="invalid-feedback">{regErrs.email}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone</label>
                    <input 
                      className={`form-control ${regErrs.phone?'is-invalid':''}`} 
                      value={reg.phone} 
                      onChange={e=>setReg(v=>({...v,phone:e.target.value}))} 
                    />
                    {regErrs.phone && <div className="invalid-feedback">{regErrs.phone}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Zipcode</label>
                    <input 
                      className={`form-control ${regErrs.zipcode?'is-invalid':''}`} 
                      value={reg.zipcode} 
                      onChange={e=>setReg(v=>({...v,zipcode:e.target.value}))} 
                    />
                    {regErrs.zipcode && <div className="invalid-feedback">{regErrs.zipcode}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Date of Birth</label>
                    <input 
                      type="date"
                      className="form-control" 
                      value={reg.dob} 
                      onChange={e=>setReg(v=>({...v,dob:e.target.value}))} 
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Password</label>
                    <input 
                      type="password" 
                      className={`form-control ${regErrs.password?'is-invalid':''}`} 
                      value={reg.password} 
                      onChange={e=>setReg(v=>({...v,password:e.target.value}))} 
                    />
                    {regErrs.password && <div className="invalid-feedback">{regErrs.password}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Confirm Password</label>
                    <input 
                      type="password" 
                      className={`form-control ${regErrs.confirm?'is-invalid':''}`} 
                      value={reg.confirm} 
                      onChange={e=>setReg(v=>({...v,confirm:e.target.value}))} 
                    />
                    {regErrs.confirm && <div className="invalid-feedback">{regErrs.confirm}</div>}
                  </div>
                  <div className="col-12">
                    <button className="btn btn-success" type="submit">Create Account</button>
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
