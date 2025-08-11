import React, { useEffect, useState, useRef } from 'react'
import { useLeads } from '../../context/LeadContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCheck, faInfoCircle, faPen } from '@fortawesome/free-solid-svg-icons';
import API from '../../api';
import ListManagerDropdown from '../utils/ListManagerDropdown';

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

  // --- Edit modal state ---
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [form, setForm] = useState({
    name: '', type: '', description: '', keywords: '',
    website: '', email: '', phone: '',
    instagram: '', facebook: '', tiktok: '',
    location: ''
  });

  const openEdit = () => {
    if (!selectedLead) return;
    setForm({
      name: selectedLead.name || '',
      type: selectedLead.type || '',
      description: selectedLead.description || '',
      keywords: Array.isArray(selectedLead.keywords) ? selectedLead.keywords.join(', ') : '',
      website: selectedLead.website || '',
      email: selectedLead.email || '',
      phone: selectedLead.phone || '',
      instagram: selectedLead.instagram || '',
      facebook: selectedLead.facebook || '',
      tiktok: selectedLead.tiktok || '',
      location: selectedLead.location || '',
    });
    setSaveError(null);
    setEditOpen(true);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        ...form,
        // send keywords as string; backend will normalize to array
        keywords: form.keywords
      };
      const { data } = await API.patch(`/leads/${selectedLeadId}`, payload);
      setSelectedLead(prev => ({ ...prev, ...data })); // optimistic: reflect updated lead
      setEditOpen(false);
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

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
    <div className='card-header d-flex justify-content-between'>
      <div className='d-flex flex-column'>
        <h1>{selectedLead ? selectedLead.name : "Lead Details"}</h1>
        <p className='text-muted m-0'>{selectedLead ? selectedLead.location : "Select a lead to view details"}</p>
      </div>

      {selectedLead && <ListManagerDropdown leadId={selectedLead.id} />}
    </div>

    {selectedLead ? (<>
      <div className='fs-5 mb-1 ps-3 d-flex align-items-center pt-2'>
        Auto Explore <FontAwesomeIcon ref={infoToggleRef} icon={faInfoCircle} className='ms-2' onClick={() => setInfoToggle(!infoToggle)} />
        {infoToggle 
          && <span ref={infoRef} className='ms-2 text-muted' style={{fontSize: '0.875rem'}}>
            Automatically explore the lead's public sources and extract any relevant information.
          </span>
        }
      </div>
      <nav className='border-bottom d-flex align-items-center px-2 pb-2'>
        <button 
          className={`btn btn-outline-${selectedLead.identityComplete ? 'success' : 'primary'}`}
          onClick={() => handleIdentityEnrichment()}
          disabled={selectedLead.identityComplete || actionLoading.identity}
        >
          {actionLoading.identity ? <div className="spinner-border spinner-border-sm" role="status" /> : 'Enrich Identity'}
          {selectedLead.identityComplete && <FontAwesomeIcon icon={faCheck} className='ms-2' />}
        </button>
        <FontAwesomeIcon icon={faArrowRight} className='ms-2' />
        <button 
          className={`ms-2 btn btn-outline-${selectedLead.contactComplete ? 'success' : 'primary'}`}
          onClick={() => handleContactEnrichment()}
          disabled={selectedLead.contactComplete || actionLoading.contact}
        >
          {actionLoading.contact ? <div className="spinner-border spinner-border-sm" role="status" /> : 'Explore Contact'}
          {selectedLead.contactComplete && <FontAwesomeIcon icon={faCheck} className='ms-2' />}
        </button>
        <FontAwesomeIcon icon={faArrowRight} className='ms-2' />
        <button 
          className={`ms-2 btn btn-outline-${selectedLead.socialComplete ? 'success' : 'primary'}`} 
          onClick={() => console.log('Explore Social Presence')} 
          disabled={selectedLead.socialComplete || actionLoading.social}
        >
          {actionLoading.social ? <div className="spinner-border spinner-border-sm" role="status" /> : 'Explore Social Presence'}
          {selectedLead.socialComplete && <FontAwesomeIcon icon={faCheck} className='ms-2' />}
        </button>
        <button
          className='btn btn-outline-secondary ms-2'
          onClick={() => openEdit()}
          title='Edit lead manually'
        >
          <FontAwesomeIcon icon={faPen} className='me-1' />
          <span className='d-none d-md-inline'>Edit Manually</span>
        </button>
      </nav>

      {editOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.35)', zIndex: 1050 }}>
          <div className="card shadow" style={{ width: 'min(920px, 92vw)' }}>
            <div className="card-header d-flex justify-content-between align-items-center">
              <strong>Edit Lead</strong>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditOpen(false)}>Close</button>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Name</label>
                  <input name="name" value={form.name} onChange={onChange} className="form-control" />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Location</label>
                  <input name="location" value={form.location} onChange={onChange} className="form-control" />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label">Type</label>
                  <input name="type" value={form.type} onChange={onChange} className="form-control" />
                </div>
                <div className="col-12 col-md-8">
                  <label className="form-label">Keywords (comma separated)</label>
                  <input name="keywords" value={form.keywords} onChange={onChange} className="form-control" placeholder="e.g. plumber, emergency, 24/7" />
                </div>

                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea name="description" value={form.description} onChange={onChange} className="form-control" rows={3} />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label">Website</label>
                  <input name="website" value={form.website} onChange={onChange} className="form-control" />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label">Email</label>
                  <input name="email" value={form.email} onChange={onChange} className="form-control" />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label">Phone</label>
                  <input name="phone" value={form.phone} onChange={onChange} className="form-control" />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label">Instagram</label>
                  <input name="instagram" value={form.instagram} onChange={onChange} className="form-control" />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label">Facebook</label>
                  <input name="facebook" value={form.facebook} onChange={onChange} className="form-control" />
                </div>
                <div className="col-12 col-md-4">
                  <label className="form-label">TikTok</label>
                  <input name="tiktok" value={form.tiktok} onChange={onChange} className="form-control" />
                </div>
              </div>

              {saveError && <div className="text-danger mt-3">{saveError}</div>}

              <div className="d-flex justify-content-end mt-4">
                <button className="btn btn-outline-secondary me-2" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</button>
                <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='card-body p-0'>
        <div className="row m-0">
          <div className="col-12 col-md-4 border p-0">
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
                Sources: 
                {selectedLead.sources && selectedLead.sources.length > 0 
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