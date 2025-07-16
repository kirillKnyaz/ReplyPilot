import React from 'react'
import { Link } from 'react-router-dom'

function PaymentSuccessfulPage() {
  return (<div className='container mt-4 text-center'>
    <h1>The payment was successful!</h1>
    <p>Thank you for your purchase. Your subscription is now active.</p>
    <Link to={"/"} className='btn btn-primary'>View Dashboard</Link>
  </div>)
}

export default PaymentSuccessfulPage