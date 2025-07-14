import { Link, Outlet } from 'react-router-dom';
import useAuth from './hooks/useAuth';
import { use, useEffect } from 'react';

function Layout() {
  const { user, authenticated, loading, logout } = useAuth();

  if (loading) return;

  return (<div className="d-flex flex-column vh-100">
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <Link to={"/"} className="navbar-brand" >ReplyPilot</Link>

        <button className="btn btn-outline-secondary" type="button" onClick={authenticated ? () => logout() : () => navigate('/login')}>
          {authenticated ? 'Logout' : 'Login'}
        </button>
      </div>
    </nav>

    <div className="container-fluid m-0 p-0 flex-grow-1">
      <Outlet />
    </div>

    <footer className="bg-light text-center text-lg-start mt-auto">
      <div className="text-center p-3">
        © 2025 ReplyPilot
      </div>
    </footer>
  </div>);
}

export default Layout;