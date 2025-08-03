import React, { useEffect, useState, useRef } from 'react'
import { useLeads } from '../../context/LeadContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCheck, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import API from '../../api';

function LeadDetails() {
  const { leads, selectedLeadId } = useLeads();
  const [infoToggle, setInfoToggle] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    identity: false,
    contact: false,
    social: false,
  });

  const [actionError, setActionError] = useState({
    identity: null,
    contact: null,
    social: null,
  });

  const infoRef = useRef(null);
  const infoToggleRef = useRef(null);

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

  const [selectedLead, setSelectedLead] = useState(leads.find(lead => lead.id === selectedLeadId));
  useEffect(() => {
    setSelectedLead(leads.find(lead => lead.id === selectedLeadId));
  }, [leads, selectedLeadId]);

  const handleIdentityEnrichment = () => {
    setActionLoading(prev => ({ ...prev, identity: true }));
    API.post(`/leads/${selectedLeadId}/enrich/identity`, {
      existingData: {}
    }).then(response => {
      console.log('Enrichment successful:', response.data);
      setSelectedLead(prev => ({ ...prev, ...response.data.updatedLead }));
    }).catch(error => {
      console.error('Error during enrichment:', error);
      setActionError(prev => ({ ...prev, identity: error.response.data.error }));
    }).finally(() => {
      setActionLoading(prev => ({ ...prev, identity: false }));
    });
  }

  const handleContactEnrichment = () => {
    setActionLoading(prev => ({ ...prev, contact: true }));
    API.post(`/leads/${selectedLeadId}/enrich/contact`, {
      existingData: {}
    }).then(response => {
      console.log('Enrichment successful:', response.data);
      setSelectedLead(prev => ({ ...prev, ...response.data.updatedLead }));
    }).catch(error => {
      console.error('Error during enrichment:', error);
      setActionError(prev => ({ ...prev, contact: error.response.data.error }));
    }).finally(() => {
      setActionLoading(prev => ({ ...prev, contact: false }));
    });
  }

  useEffect(() => {
    if (selectedLeadId && !selectedLead) {
      setActionError({
        identity: null,
        contact: null,
        social: null,
      })
    }
  }, [selectedLeadId, selectedLead]);

  return (<div className='card'>
    <div className='card-header'>
      <h1>{selectedLead ? selectedLead.name : "Lead Details"}</h1>
      <p className='text-muted m-0'>{selectedLead ? selectedLead.location : "Select a lead to view details"}</p>
    </div>

    {selectedLead ? (<>
      <div className='fs-5 mb-1 ps-3 d-flex align-items-center pt-2'>
        Lead Progress <FontAwesomeIcon ref={infoToggleRef} icon={faInfoCircle} className='ms-2' onClick={() => setInfoToggle(!infoToggle)} />
        {infoToggle 
          && <span ref={infoRef} className='ms-2 text-muted' style={{fontSize: '0.875rem'}}>
            By following these steps, you can effectively explore the lead's information and take appropriate actions.
          </span>
        }
      </div>
      <nav className='border-bottom d-flex align-items-center px-2 pb-2'>
        <button 
          className={`btn btn-outline-${selectedLead.identityComplete ? 'success' : 'secondary'}`}
          onClick={() => handleIdentityEnrichment()}
          disabled={selectedLead.identityComplete || actionLoading.identity}
        >
          {actionLoading.identity ? <div className="spinner-border spinner-border-sm" role="status" /> : 'Enrich Identity'}
          {selectedLead.identityComplete && <FontAwesomeIcon icon={faCheck} className='ms-2' />}
        </button>
        <FontAwesomeIcon icon={faArrowRight} className='ms-2' />
        <button 
          className={`ms-2 btn btn-outline-${selectedLead.contactComplete ? 'success' : 'secondary'}`}
          onClick={() => handleContactEnrichment()}
          disabled={selectedLead.contactComplete || actionLoading.contact}
        >
          {actionLoading.contact ? <div className="spinner-border spinner-border-sm" role="status" /> : 'Explore Contact'}
          {selectedLead.contactComplete && <FontAwesomeIcon icon={faCheck} className='ms-2' />}
        </button>
        <FontAwesomeIcon icon={faArrowRight} className='ms-2' />
        <button 
          className={`ms-2 btn btn-outline-${selectedLead.socialComplete ? 'success' : 'secondary'}`} 
          onClick={() => console.log('Explore Social Presence')} 
          disabled={selectedLead.socialComplete || actionLoading.social}
        >
          {actionLoading.social ? <div className="spinner-border spinner-border-sm" role="status" /> : 'Explore Social Presence'}
          {selectedLead.socialComplete && <FontAwesomeIcon icon={faCheck} className='ms-2' />}
        </button>
      </nav>

      <div className='card-body p-0'>
        <div className="row m-0">
          <div className="col-12 col-sm-6 col-md-4 border p-0">
            <h5 className='d-flex align-items-center border-bottom p-2'>
              <span>Identity</span> 
              <span className={`fs-6 fw-light ms-1 text-${selectedLead.identityComplete ? 'info' : 'danger'}`}>
                ({selectedLead.identityComplete ? 'Complete' : 'Incomplete'})
              </span>
            </h5>
            <div className='p-2'>
              <p className='fs-5 fw-normal'>{selectedLead.type || 'No type available'}</p>
              <p className='text-muted'>{selectedLead.description || 'No description available'}</p>
              <p className='text-muted'>
                Keywords: 
                <span className='fw-light ms-1'>{selectedLead.keywords && selectedLead.keywords.length > 0 ? selectedLead.keywords.join(', ') : 'No keywords available'}</span>
              </p>

              <p className='m-0'>
                Sources: {
                selectedLead.sources && selectedLead.sources.length > 0 
                  ? selectedLead.sources.filter((source) => source.goal === 'IDENTITY').map((source, index) => (
                    <a key={index} className='badge bg-secondary me-1' href={source.url} target="_blank" rel="noopener noreferrer">{source.url}</a>
                  ))
                  : 'No sources available'
                }
              </p>
              
              {actionError.identity && <div className='text-danger ms-3'>{actionError.identity}</div>}
            </div>
          </div>

          <div className="col-12 col-md-4 border p-0">
            <h5 className='d-flex align-items-center border-bottom p-2'>
              <span>Contact</span> 
              <span className={`fs-6 fw-light ms-1 text-${selectedLead.contactComplete ? 'info' : 'danger'}`}>
                ({selectedLead.contactComplete ? 'Complete' : 'Incomplete'})
              </span>
            </h5>
            <div className='p-2 d-flex flex-column p-0'>
              <div className='flex-grow-1'>
                <p className='text-muted'>{selectedLead.phone || 'No contact phone available'}</p>
                <p className='text-muted'>{selectedLead.email || 'No contact email available'}</p>
                <p className='text-muted'>{selectedLead.facebook || 'No contact facebook available'}</p>
                <p className='text-muted'>{selectedLead.tiktok || 'No contact tiktok available'}</p>

              </div>
              <p className='m-0'>
                Sources: {
                selectedLead.sources && selectedLead.sources.length > 0 
                  ? selectedLead.sources.filter((source) => source.goal === 'CONTACT').map((source, index) => (
                    <a key={index} className='badge bg-secondary me-1' href={source.url} target="_blank" rel="noopener noreferrer">{source.url}</a>
                  ))
                  : 'No sources available'
                }
              </p>
            </div>
          </div>

          <div className="col-12 col-md-4 border p-0">
            <h5 className='d-flex align-items-center border-bottom p-2'>
              <span>Social Media</span> 
              <span className={`fs-6 fw-light ms-1 text-${selectedLead.socialComplete ? 'info' : 'danger'}`}>
                ({selectedLead.socialComplete ? 'Complete' : 'Incomplete'})
              </span>
            </h5>
            <div className='p-2 d-flex flex-column p-0'>
              <div className='flex-grow-1'>
                <p className='fs-5 fw-normal'>
                  Social summary: goes here
                </p>

              </div>
              <p className='m-0'>
                Sources: {
                selectedLead.sources && selectedLead.sources.length > 0 
                  ? selectedLead.sources.filter((source) => source.goal === 'SOCIAL').map((source, index) => (
                    <a key={index} className='badge bg-secondary me-1' href={source.url} target="_blank" rel="noopener noreferrer">{source.url}</a>
                  ))
                  : 'No sources available'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </>) : (
      <p>No lead selected</p>
      )}
  </div>)
}

export default LeadDetails