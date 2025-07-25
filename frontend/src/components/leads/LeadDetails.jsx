import React from 'react'
import { useLeads } from '../../context/LeadContext';

function LeadDetails() {
  const { leads, selectedLeadId } = useLeads();
  
  const selectedLead = leads.find(lead => lead.id === selectedLeadId);

  const formatWebUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://${url}`;
  }

  return (<div className='card'>
    <div className='card-header'>
      <h1>{selectedLead ? selectedLead.name : "Lead Details"}</h1>
    </div>

    <div className='card-body'>
      {selectedLead ? (
        <div>
          <p><strong>Website:</strong> <a href={formatWebUrl(selectedLead.website)} target='_blank' rel='noopener noreferrer'>{selectedLead.website}</a></p>


          <p><strong>Email:</strong> <a href={`mailto:${selectedLead.email}`} target='_blank' rel='noopener noreferrer'>{selectedLead.email}</a></p>
          <p><strong>Phone:</strong> <a href={`tel:${selectedLead.phone}`} target='_blank' rel='noopener noreferrer'>{selectedLead.phone}</a></p>
        </div>
      ) : (
        <p>No lead selected</p>
      )}
    </div>
  </div>)
}

export default LeadDetails