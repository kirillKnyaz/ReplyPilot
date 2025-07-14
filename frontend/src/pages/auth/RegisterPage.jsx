import { useState } from 'react';
import API from '../../api';
import { data, Link, useNavigate } from 'react-router-dom';

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const navigate = useNavigate();

  const handleEmailBlur = async () => {
    if (!email) return;

    try {
      const res = await API.get('/auth/exists', { params: { email } });
      if (res.data.exists) {
        setRegisterError('Email is already in use, redirecting...');
        navigate('/login', { state: { redirectEmail: email } });
      } else {
        setRegisterError('');
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setRegisterError('Email and password are required');
      return;
    }

    try {
      const res = await API.post('/auth/register', { email, password });
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      setRegisterError(error.response?.data?.message || 'Registration failed');
    }
  };

  return (<div className="d-flex flex-column w-100 vh-100 justify-content-center align-items-center">
    <h1 className="mb-4"><Link to={"/"} className='text-decoration-none text-dark'>ReplyPilot</Link></h1>
    <form onSubmit={handleRegister} className="w-100 d-flex flex-column justify-content-center align-items-center mb-5 card px-3 py-4 rounded-4" style={{ maxWidth: 400 }}>
      <h2>Register</h2>
      <input
        type="email"
        className="form-control my-2"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={handleEmailBlur}
      />
      <input
        type="password"
        className="form-control my-2"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type='submit' className="btn btn-primary w-100">Create Account</button>
      {registerError && <div className="text-danger align-self-start mt-2 ms-1">{registerError}</div>}

      <div className="align-self-start mt-3 ms-1">
        Already have an account? <Link className="text-decoration-none" to="/login">Login</Link>
      </div>
    </form>
  </div>);
}

export default RegisterPage;