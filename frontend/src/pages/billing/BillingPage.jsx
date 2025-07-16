import React, { useEffect } from 'react'
import useAuth from '../../hooks/useAuth';

function BillingPage() {
  const { authenticated, user, loading } = useAuth();

  //redirect block
  useEffect(() => {
    // fetch subscription?? maybe should be inside of user
    

  }, [])


  return (<>
    <div className='container mt-4'>
      <h1>Billing Info</h1>
    </div>
  </>)
}

export default BillingPage