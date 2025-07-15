import { useEffect, useState } from 'react';
import API from '../../api';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

function LoginPage() {  
  const location = useLocation();
  const state = location.state || {};

  const [email, setEmail] = useState(state.redirectEmail || '');
  const [loggedOutMessage, setLoggedOutMessage] = useState(state.logoutMessage || '');
  const [loginMessage, setLoginMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const { login } = useAuth();

  useEffect(() => {
    if (loggedOutMessage) {
      setTimeout(() => setLoggedOutMessage(''), 3000); // Clear message after 3 seconds
    }
  }, [loggedOutMessage]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLoginMessage('Email and password are required');
      return;
    }
    setLoading(true);

    await login(email, password);
    setLoading(false);
    setLoginMessage('');
  };

  return (<div className="d-flex flex-column w-100 vh-100 justify-content-center align-items-center">
    {loggedOutMessage && <div className="text-success mb-3">{loggedOutMessage}</div>}
    <h1 className="mb-4"><Link to={"/"} className='text-decoration-none text-dark'>ReplyPilot</Link></h1>
    <form onSubmit={(e) => handleLogin(e)} className="w-100 d-flex flex-column justify-content-center align-items-center mb-5 card px-3 py-4 rounded-4" style={{ maxWidth: 400 }}>
      <h2>Login</h2>
      <input
        type="email"
        className="form-control my-2"
        placeholder="Email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setLoginMessage(''); // Clear message on input change
        }}
      />
      <input
        type="password"
        className="form-control my-2"
        placeholder="Password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setLoginMessage(''); // Clear message on input change
        }}
      />

      <Link className="mb-3 align-self-start ms-1 text-decoration-none">forgot password?</Link>

      <button type='submit' className="btn btn-primary w-100">Login</button>
      {loginMessage && <div className="text-danger mt-2 ms-1 align-self-start">{loginMessage}</div>}
      {loading && <div className="spinner-border mt-2 ms-1 align-self-start"></div>}
      <div className="align-self-start mt-3">
        Don't have an account? <Link className="text-decoration-none" to="/register">Register</Link>
      </div>
    </form>
  </div>);
}

export default LoginPage;