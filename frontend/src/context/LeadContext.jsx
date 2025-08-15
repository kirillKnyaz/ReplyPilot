// context/LeadContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import API from '../api';

const LeadContext = createContext();
export const useLeads = () => useContext(LeadContext);

export const LeadProvider = ({ children }) => {
  const [leads, setLeads] = useState([]);
  const [lists, setLists] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [selectedListId, setSelectedListId] = useState(null);

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

  //get lists
  useEffect(() => {
    API.get('/lists').then((response) => {
      console.log('Fetched lists:', response.data);
      setLists(response.data);
    }).catch((error) => {
      console.error('Failed to fetch lists:', error);
    });
  }, []);

  const addLead = (lead, setShowAddForm, setNewLead) => {
    setActionLoading(true);
    setActionError(null);
    API.post('/leads', lead).then((response) => {
      setLeads((prev) => [...prev, response.data]);
    }).catch((error) => {
      console.error('Failed to create lead:', error);
      setActionError(error);
    }).finally(() => {
      setActionLoading(false);
      setShowAddForm(false);
      if (typeof setShowAddForm === 'function') setShowAddForm(false);  // <-- guard
      if (typeof setNewLead === 'function') setNewLead({ name: '', location: '', website: '' });
    });
  }

  const deleteLead = (leadId) => {
    setActionLoading(true);
    setActionError(null);
    API.delete(`/leads/${leadId}`).then(() => {
      setLeads((prev) => prev.filter(lead => lead.id !== leadId));
      if (selectedLeadId === leadId) {
        setSelectedLeadId(null);
      }
    }).catch((error) => {
      console.error('Failed to delete lead:', error);
      setActionError(error);
    }).finally(() => {
      setActionLoading(false);
    });
  }

  const addList = (name) => {
    setActionLoading(true);
    setActionError(null);
    API.post('/lists', { name }).then((response) => {
      setLists((prev) => [...prev, response.data]);
    }).catch((error) => {
      console.error('Failed to create list:', error);
      setActionError(error);
    }).finally(() => {
      setActionLoading(false);
    });
  }

  const deleteList = (listId) => {
    setActionLoading(true);
    setActionError(null);
    API.delete(`/lists/${listId}`).then(() => {
      setLists((prev) => prev.filter(list => list.id !== listId));
    }).catch((error) => {
      console.error('Failed to delete list:', error);
      setActionError(error);
    }).finally(() => {
      setActionLoading(false);
    });
  }

  const selectLead = (id) => setSelectedLeadId(id);
  const selectList = (id) => setSelectedListId(id === "All leads" ? null : id);

  const filteredLeads = selectedListId ? leads.filter(lead => lead.lists?.some(list => list.id === selectedListId)) : leads;

  const countLeadsByList = (listId) => {
    return leads.filter(lead => lead.lists?.some(list => list.id === listId)).length;
  };

  return (
    <LeadContext.Provider value={{ leads: filteredLeads, setLeads, addLead, selectedLeadId, selectLead, dataLoading, actionLoading, actionError, deleteLead, lists, addList, deleteList, selectedListId, selectList, countLeadsByList }}>
      {children}
    </LeadContext.Provider>
  );
};