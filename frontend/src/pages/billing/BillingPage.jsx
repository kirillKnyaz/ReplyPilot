import React, { useEffect, useState } from 'react'
import useAuth from '../../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';

function BillingPage() {
  const { authenticated, user, loading } = useAuth();
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const navigate = useNavigate();

  //redirect block
  useEffect(() => {
    // fetch subscription?? maybe should be inside of user
    if (!loading && authenticated && user) {
      if (user.subscription == null || user.subscription.active == false) {
        navigate('/pricing');
      }
    }

    API.get(`/billing/subscription`).then(response => {
      // Handle the subscription data
      setSubscription(response.data);
      console.log('Subscription data:', response.data);
    }).catch(error => {
      console.error('Error fetching subscription:', error);
      if (error.response && error.response.status === 404) {
        setErrorMessage('No active subscription found.');
      }

      setErrorMessage('Failed to fetch subscription data');
    }).then(() => {
      setSubscriptionLoading(false);
    });
  }, [loading, authenticated, user]);

  const cancelSubscription = async () => {
    if (!subscription || !subscription.id) {
      console.error('No subscription to cancel');
      return;
    }
    console.log('Cancelling subscription:', subscription.id);
    setActionLoading(true);

    API.post('/billing/cancel', {
      stripeSubscriptionId: subscription.id,
    }).then(response => {
      console.log('Subscription cancellation response:', response.data);
      // Update local subscription state
      setSubscription(response.data);
    }).catch(error => {
      console.error('Error cancelling subscription:', error);
    }).finally(() => {
      setActionLoading(false);
    });
  }

  const renewSubscription = async () => {
    if (!subscription || !subscription.id) {
      console.error('No subscription to renew');
      return;
    }

    setActionLoading(true);
    console.log('Renewing subscription:', subscription.id);
    API.post('/billing/renew', {
      stripeSubscriptionId: subscription.id,
    }).then(response => {
      console.log('Subscription renewal response:', response.data);
      // Update local subscription state
      setSubscription(response.data);
    }).catch(error => {
      console.error('Error renewing subscription:', error);
    }).finally(() => {
      setActionLoading(false);
    });
  }

  const cancelImmediately = async () => {
    if (!subscription || !subscription.id) {
      console.error('No subscription to cancel immediately');
      return;
    }

    setActionLoading(true);
    console.log('Cancelling subscription immediately:', subscription.id);
    API.post('/billing/full-cancel', {
      stripeSubscriptionId: subscription.id,
    }).then(response => {
      console.log('Subscription cancellation response:', response.data);
      // Update local subscription state
      navigate('/pricing', {
        state: { message: response.data.message }
      }); // Redirect to pricing page after cancellation
      setSubscription(null);
    }).catch(error => {
      console.error('Error cancelling subscription:', error);
    }).finally(() => {
      setActionLoading(false);
    });
  }

  const firstLetterUpperCase = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  return (<>
    <div className='container p-4'>
      <h1>Billing Info</h1>
      <Link to={'/'} className='text-decoration-none'><FontAwesomeIcon icon={faArrowLeft}/> Back to dashboard</Link>

      {errorMessage && <div className='text-danger'>{errorMessage}</div>}

      <div className="row gap-2 mt-3">
        {subscriptionLoading 
        ? <div className='card'>
          <div className="card-body">
            <h5 className="card-title placeholder-glow">
              <span className="placeholder col-6"></span>
            </h5>

            <button className='btn btn-secondary' disabled style={{height: '2rem', width: '6rem'}}></button>
          </div>
        </div>
        : subscription && subscription.items.data[0].plan.active
          ? <div className="card mb-3" key={subscription.stripeId} style={{ maxWidth: '540px' }}> 
              <div className="card-body">
                <p className={`card-title text-${subscription.status === 'active' ? 'success' : 'danger'}`}>
                  {firstLetterUpperCase(subscription.status)} Subscription
                </p>
                <p className="card-text fw-semibold fs-3 m-0">{subscription.productName}</p>
                <p className="card-text mt-0 ">
                  {subscription.items.data[0].plan.amount_decimal / 100} {subscription.items.data[0].plan.currency.toUpperCase()} / {subscription.items.data[0].plan.interval}
                </p>
                <p className="card-text">
                  Last billed: {new Date(subscription.items.data[0].current_period_start * 1000).toLocaleDateString()}
                </p>
                {!subscription.cancel_at_period_end && <p className="card-text">
                  Next billing: {new Date(subscription.items.data[0].current_period_end * 1000).toLocaleDateString()} <FontAwesomeIcon icon={faArrowLeft} className='ms-2 text-primary' />
                </p>}
                <p className="card-text">
                  Auto-renew: <span className={`text-${subscription.cancel_at_period_end ? 'warning' : 'success'}`}>{subscription.cancel_at_period_end ? "Canceled" : "Enabled"}</span>
                </p>
                <p className="card-text text-muted small">
                  Stripe Sub ID: {subscription.id}
                </p>

                {subscription.cancel_at_period_end 
                  ? <div className='d-flex flex-column'>
                      <div>
                        <button className='btn btn-outline-secondary' disabled>
                          Subscription will end on {new Date(subscription.items.data[0].current_period_end * 1000).toLocaleDateString()}
                        </button>

                        <button className='btn' type='button' onClick={() => renewSubscription()}>Renew <FontAwesomeIcon icon={faArrowRight} className='ms-1' /></button>
                      </div>
                      <button className='btn btn-link align-self-start text-secondary' type='button' onClick={() => cancelImmediately()}>
                        Cancel immediately
                      </button>
                    </div> 
                  : <button className='btn btn-outline-danger' onClick={() => cancelSubscription()}>
                    Cancel Subscription
                  </button>
                }
                {actionLoading && <div className='spinner-border spinner-border-sm ms-2' role='status'/>}
              </div>
            </div>
          : <div className="card">
              <div className="card-body">
                <h5 className="card-title">No Active Subscription</h5>
                <p className="card-text">You do not have an active subscription.</p>
              </div>
            </div>
          }
      </div>
    </div>
  </>)
}

export default BillingPage