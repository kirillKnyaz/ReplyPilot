import { useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import LeadSidebar from "../../components/leads/LeadSidebar";
import LeadDetails from "../../components/leads/LeadDetails";
import { useState } from "react";
import DiscoverLeadsMap from "../../components/leads/DiscoverLeadsMap";

function DashboardPage() {
  const { loading, authenticated, user } = useAuth();
  const navigate = useNavigate();

  const [toggle, setToggle] = useState(0);

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
    <div className="d-flex h-100 w-100 overflow-hidden position-relative">
      <main className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0, overflow: 'auto' }}>
        <nav className="w-100 nav-tabs">
          <ul className="nav nav-tabs">
            <li className="nav-item" onClick={() => setToggle(0)}>
              <a className={`nav-link ${toggle === 0 && "active"}`}>Leads</a>
            </li>
            <li className="nav-item" onClick={() => setToggle(1)}>
              <a className={`nav-link ${toggle === 1 && "active"}`}>Discovery</a>
            </li>
            <li className="nav-item" onClick={() => setToggle(2)}>
              <a className={`nav-link ${toggle === 2 && "active"}`}>Settings</a>
            </li>
          </ul>
        </nav>
        <div className="p-3">
          {toggle === 0 && <LeadDetails />}
          {toggle === 1 && <DiscoverLeadsMap />}
          {toggle === 2 && <div>Settings Content</div>}
        </div>
      </main>
      <LeadSidebar />
    </div>
  );
}

export default DashboardPage;