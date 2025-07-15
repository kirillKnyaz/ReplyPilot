import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect } from 'react'
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

function UserMenu() {
  const { logout } = useAuth();
  const [ dropdownOpen, setDropdownOpen ] = React.useState(null);
  const menuRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (<div>
    <button className='btn btn-outline-secondary rounded-circle p-2' onClick={() => setDropdownOpen(!dropdownOpen)}>
      <img src='pfp.png' alt='Profile' style={{ width: '30px', height: '30px' }} />
    </button>
    {dropdownOpen && <div 
      ref={menuRef}
      className='position-absolute d-flex flex-column bg-white border rounded col-12 col-md-3 top-100 end-0 m-md-3 pt-3' 
      style={{ zIndex: 1000 }}
    >
      <Link className='w-100 menu-link p-1 ps-4 m-0 text-decoration-none text-dark' to={"/"}>Dashboard</Link>
      <Link className='w-100 menu-link p-1 ps-4 m-0 text-decoration-none text-dark'>Profile</Link>
      <Link className='w-100 menu-link p-1 ps-4 m-0 text-decoration-none text-dark' to={"/onboarding"}>Onboarding</Link>
      <Link className='w-100 menu-link p-1 ps-4 m-0 text-decoration-none text-dark' to={"/pricing"}>Billing</Link>
     
      <button className='btn btn-outline-danger m-3' type='button' onClick={() => logout()}>
        <span>Logout</span>
        <FontAwesomeIcon icon={faRightFromBracket} className='ms-2' />
      </button>
    </div>}
  </div>)
}

export default UserMenu