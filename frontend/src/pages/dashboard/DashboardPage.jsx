import { useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

function DashboardPage() {
  const { loading, authenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // Wait until loading is complete
    if (!authenticated) {
      navigate('/login'); // Redirect to login if not authenticated
    }

    if (user && !user.profile) {
      navigate('/onboarding'); // Redirect to profile setup if no profile exists
    }
  }, [user, loading, authenticated]);

  return (
    <div>
      <h1 className="mb-3">Welcome to ReplyPilot</h1>
      <p>This is your dashboard. Start prospecting!</p>
    </div>
  );
}

export default DashboardPage;