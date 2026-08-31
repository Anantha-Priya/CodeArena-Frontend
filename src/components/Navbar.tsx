import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar__brand">
        CodeArena
      </NavLink>
      <div className="navbar__links">
        {user?.role === 'ADMIN' ? (
          <>
            <NavLink to="/admin/coders">Coders</NavLink>
            <NavLink to="/profile">Profile</NavLink>
            <NavLink to="/admin/problems">Create Problem</NavLink>
            <NavLink to="/admin/contests">Create Contest</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/problems">Problems</NavLink>
            <NavLink to="/contests">Contests</NavLink>
            <NavLink to="/submissions/my">My Submissions</NavLink>
            <NavLink to="/profile">Profile</NavLink>
          </>
        )}
      </div>
      <div className="navbar__user">
        {user && (
          <span className="navbar__identity">
            {user.role === 'ADMIN' ? user.username : `${user.username} · ${user.rating}`}
          </span>
        )}
        <button type="button" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </nav>
  );
}
