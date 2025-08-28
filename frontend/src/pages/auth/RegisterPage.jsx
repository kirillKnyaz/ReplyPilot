import { useState } from 'react';
import API from '../../api';
import { data, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

function RegisterPage() {
  const [register, setRegister] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  function handleSetRegisterField(field, value) {
    setRegister(prev => ({ ...prev, [field]: value }));
    setRegisterError('');
  }

  const [registerError, setRegisterError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleEmailBlur = async () => {
    if (!register.email) return;
    if (!/\S+@\S+\.\S+/.test(register.email)) return;

    try {
      const res = await API.get('/auth/exists', { params: { email: register.email } });
      if (res.data.exists) {        
        navigate('/login', { 
          state: { 
            redirectEmail: register.email,
            redirectMessage: 'User already exists, please login.'
          } 
        });
      } else {
        setRegisterError('');
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!register.email || !register.password || !register.confirmPassword) {
      setRegisterError('Email and password are required');
      return;
    }
    if (register.password !== register.confirmPassword) {
      setRegisterError('Passwords do not match');
      return;
    }

    try {
      const res = await API.post('/auth/register', { email: register.email, password: register.password });
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
        value={register.email}
        onChange={(e) => {
          handleSetRegisterField('email', e.target.value);
        }}
        onBlur={handleEmailBlur}
      />
      <div className='input-group my-2'>
        <input
          type={showPassword ? "text" : "password"}
          className="form-control"
          placeholder="Password"
          value={register.password}
          onChange={(e) => {
            handleSetRegisterField('password', e.target.value);
          }}
        />
        <button className="btn border" type="button" onClick={() => setShowPassword(!showPassword)}>
          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
        </button>
      </div>
      <div className='input-group mt-2 mb-4'>
        <input
          type={showPassword ? "text" : "password"}
          className="form-control"
          placeholder="Confirm Password"
          value={register.confirmPassword}
          onChange={(e) => {
            handleSetRegisterField('confirmPassword', e.target.value);
          }}
        />
        <button className="btn border" type="button" onClick={() => setShowPassword(!showPassword)}>
          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
        </button>
      </div>
      

      <button type='submit' className="btn btn-primary w-100">Create Account</button>
      {registerError && <div className="text-danger align-self-start mt-2 ms-1">{registerError}</div>}

      <div className="align-self-start mt-3 ms-1">
        Already have an account? <Link className="text-decoration-none" to="/login">Login</Link>
      </div>
    </form>
  </div>);
}

export default RegisterPage;