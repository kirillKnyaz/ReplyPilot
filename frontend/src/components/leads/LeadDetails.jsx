import React, { useEffect } from 'react'
import { useLeads } from '../../context/LeadContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCheck, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

function LeadDetails() {
  const { leads, selectedLeadId } = useLeads();
  const [infoToggle, setInfoToggle] = React.useState(false);
  const infoRef = React.useRef(null);
  const infoToggleRef = React.useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (infoRef.current && !infoRef.current.contains(event.target) && !infoToggleRef.current.contains(event.target)) {
        setInfoToggle(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedLead = leads.find(lead => lead.id === selectedLeadId);

  const formatWebUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://${url}`;
  }

  const hasWebsite = selectedLead && selectedLead.website && selectedLead.website.trim() !== '';
  const hasEmail = selectedLead && selectedLead.email && selectedLead.email.trim() !== '';

  return (<div className='card'>
    <div className='card-header'>
      <h1>{selectedLead ? selectedLead.name : "Lead Details"}</h1>
    </div>

    {selectedLead ? (<>
      <div className='fs-5 mb-1 ms-1 d-flex align-items-center'>
        Lead Progress <FontAwesomeIcon ref={infoToggleRef} icon={faInfoCircle} className='ms-2' onClick={() => setInfoToggle(!infoToggle)} />
        {infoToggle 
          && <span ref={infoRef} className='ms-2 text-muted' style={{fontSize: '0.875rem'}}>
            By following these steps, you can effectively explore the lead's information and take appropriate actions.
          </span>
        }
      </div>
      <nav className='nav nav-tabs d-flex align-items-center'>
        
      </nav>
      <div className='card-body'>
        <p><strong>Website:</strong> <a href={formatWebUrl(selectedLead.website)} target='_blank' rel='noopener noreferrer'>{selectedLead.website}</a></p>


        <p><strong>Email:</strong> <a href={`mailto:${selectedLead.email}`} target='_blank' rel='noopener noreferrer'>{selectedLead.email}</a></p>
        <p><strong>Phone:</strong> <a href={`tel:${selectedLead.phone}`} target='_blank' rel='noopener noreferrer'>{selectedLead.phone}</a></p>
      </div>
    </>) : (
      <p>No lead selected</p>
      )}
  </div>)
}

export default LeadDetails