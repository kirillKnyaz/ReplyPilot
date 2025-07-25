// context/LeadContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import API from '../api';

const LeadContext = createContext();
export const useLeads = () => useContext(LeadContext);

export const LeadProvider = ({ children }) => {
  const [leads, setLeads] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const [dataLoading, setDataLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    API.get('/leads').then((response) => {
      console.log('Fetched leads:', response.data);
      setLeads(response.data);
    }).catch((error) => {
      console.error('Failed to fetch leads:', error);
    }).finally(() => {
      setDataLoading(false);
    });
  }, []);

  const addLead = (lead) => {
    setActionLoading(true);
    setActionError(null);
    API.post('/leads', lead).then((response) => {
      setLeads((prev) => [...prev, response.data]);
    }).catch((error) => {
      console.error('Failed to create lead:', error);
      setActionError(error);
    }).finally(() => {
      setActionLoading(false);
    });
  }
  
  const selectLead = (id) => setSelectedLeadId(id);

  return (
    <LeadContext.Provider value={{ leads, addLead, selectedLeadId, selectLead, dataLoading, actionLoading, actionError }}>
      {children}
    </LeadContext.Provider>
  );
};