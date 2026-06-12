import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function NavBar() {
  const { user, logout, avatarUrl } = useAuth()
  const nav = useNavigate()
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary sticky-top shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold" to={user ? '/main' : '/'}>
          SocialLite
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#nav"
          aria-controls="nav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="nav">
          <ul className="navbar-nav me-auto">
            {user && (
              <li className="nav-item">
                <Link className="nav-link" to="/main">Feed</Link>
              </li>
            )}
            {user && (
              <li className="nav-item">
                <Link className="nav-link" to="/profile">Profile</Link>
              </li>
            )}
          </ul>
          {user ? (
            <div className="d-flex align-items-center gap-2">
              <img src={avatarUrl} alt="avatar" className="rounded" width="36" height="36" style={{ objectFit: 'cover' }} />
              <span className="text-white small">{user.username}</span>
              <button className="btn btn-light btn-sm" onClick={() => { logout(); nav('/') }}>Logout</button>
            </div>
          ) : (
            <div className="text-white-50 small">Welcome</div>
          )}
        </div>
      </div>
    </nav>
  )
}