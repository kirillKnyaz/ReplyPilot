import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { authenticated, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !authenticated) {
      navigate('/login');
    }

    if (!loading && authenticated && user) {
      if (user.subscription.ended_at && Date.now() > new Date(user.subscription?.ended_at * 1000)) {
        navigate('/pricing', {
          state: {
            message: 'Your subscription has expired. Please renew to continue using the service.'
          }
        });
      }
      if (user.subscription == null || user.subscription.active == false) {
        navigate('/pricing');
      }
    }

    if (user && user.profile && (user.profile.icpSummary == null || user.profile.icpSummary === undefined)) {
      navigate('/onboarding');
    }
  }, [loading, authenticated, user, navigate]);

  if (loading) return null; // or show a loading spinner

  return children;
}