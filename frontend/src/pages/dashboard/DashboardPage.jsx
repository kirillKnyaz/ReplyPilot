import { useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import LeadSidebar from "../../components/leads/LeadSidebar";

function DashboardPage() {
  const { loading, authenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return; // Wait until loading is complete
    if (!authenticated) {
      navigate('/login'); // Redirect to login if not authenticated
    }

    if (!loading && user) {
      if (!user.profile) {
        navigate('/onboarding'); // Redirect to onboarding if no profile data
      }
    }
  }, [user, loading, authenticated]);

  return (
    <div className="container-fluid p-0 d-flex h-100">
      <main className="flex-grow-1"></main>

      <div>
        <LeadSidebar />
      </div>

    </div>
  );
}

export default DashboardPage;