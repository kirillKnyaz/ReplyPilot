import React from 'react'

function UserMenu() {
  const [ dropdownOpen, setDropdownOpen ] = React.useState(null);

  return (<div>
    <button className='btn btn-outline-secondary' onClick={() => setDropdownOpen(!dropdownOpen)}>User Menu</button>
    {dropdownOpen && <div className='position-absolute bg-white border rounded vw-100 top-100 start-0 p-3'>
      <li>Profile</li>
      <li>Settings</li>
      <li>Logout</li>
    </div>}
  </div>)
}

export default UserMenu