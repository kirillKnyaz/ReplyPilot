import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { Link } from 'react-router-dom'

function PaymentCancelPage() {
  return (
    <div className='container mt-4 d-flex flex-column align-items-center'>
      <h1>Payment Cancelled</h1>
      <p>Your payment was not successful. Please try again.</p>
      
      <div className='d-flex gap-3'>
        <Link to={"/pricing"} className='btn btn-primary'>
          <FontAwesomeIcon icon={faArrowLeft} className='me-2'/>
          Back to Pricing
        </Link>
        <Link to={"/"} className='btn'>View Dashboard</Link>
      </div>
    </div>
  )
}

export default PaymentCancelPage