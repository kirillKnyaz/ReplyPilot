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
      if (user.subscription == null || user.subscription.active == false) {
        navigate('/pricing');
      }
    }

    if (user && user.profile && !user.profile.icpSummary) {
      navigate('/onboarding');
    }
  }, [loading, authenticated, user, navigate]);

  if (loading) return null; // or show a loading spinner

  return children;
}