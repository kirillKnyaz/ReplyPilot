import { faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react'

import { loadStripe } from '@stripe/stripe-js';
import API from '../../api';
import useAuth from '../../hooks/useAuth';

const pricingTiers = [
  {
    name: 'Base Outreach',
    price: '$25/month',
    features: [
      '10 Threads simultaneously',
      '50 messages /thread',
      '3 Discovery requests /day'
    ],
    cta: 'Get Started now'
  }
];

function PricingPage() {
  const { authenticated, user, loading } = useAuth();
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

  const handleCheckout = async () => {
    const stripe = await stripePromise;

    const { data } = await API.post(`/billing/create-checkout-session`, {
      userId: user.id,
      priceId: import.meta.env.VITE_BASE_OUTREACH_PRICE_ID
    })
  }

  return (<div className='container mt-4'>
    <h1>Pricing</h1>
    <div className='row mt-5'>
      {pricingTiers.map((tier, index) => (
        <div key={index} className='col-md-4 mb-4'>
          <div className='card'>
            <div className='card-body'>
              <h5 className='card-title'>{tier.name}</h5>
              <p className='card-text'>{tier.price}</p>
              <ul className='list-group list-group-flush'>
                {tier.features.map((feature, idx) => (
                  <li key={idx} className='list-group-item'>{feature}</li>
                ))}
              </ul>
            </div>

            <div className='card-footer d-flex justify-content-start'>
              <button className='btn btn-primary w-100'>
                {tier.cta}
                <FontAwesomeIcon icon={faCreditCard} className='ms-2' />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>)
}

export default PricingPage