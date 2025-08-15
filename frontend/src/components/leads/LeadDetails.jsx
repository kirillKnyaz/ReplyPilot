import React, { useEffect, useState, useRef } from 'react'
import { useLeads } from '../../context/LeadContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCheck, faEnvelope, faInfoCircle, faMagnifyingGlass, faPen, faPhone } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';
import API from '../../api';
import ListManagerDropdown from '../utils/ListManagerDropdown';
import EnrichmentLog from '../utils/EnrichmentLog';

function LeadDetails() {
  const { leads, setLeads, selectedLeadId, lists } = useLeads();
  const [actionLoading, setActionLoading] = useState({
    identity: false,
    contact: false,
  });

  const [actionEval, setActionEval] = useState({
    identity: null,
    contact: null,
  });

  const [actionError, setActionError] = useState({
    identity: null,
    contact: null,
  });

  // --- Edit modal state ---
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [form, setForm] = useState({
    name: '', 
    type: '', 
    description: '', 
    keywords: '',
    website: '', 
    email: '', 
    phone: '',
    instagram: '', 
    facebook: '', 
    tiktok: '',
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

  const [selectedLead, setSelectedLead] = useState(leads.find(lead => lead.id === selectedLeadId));
  useEffect(() => {
    setSelectedLead(leads.find(lead => lead.id === selectedLeadId));
  }, [leads, selectedLeadId]);

  const handleIdentityEnrichment = () => {
    setActionLoading(prev => ({ ...prev, identity: true }));
    setActionError({ contact: null, identity: null });
    setActionEval({ identity: null, contact: null });
    API.post(`/leads/${selectedLeadId}/enrich/identity`, {
      existingData: {}
    }).then(response => {
      console.log('Enrichment successful:', response.data);
      setActionEval(prev => ({ ...prev, identity: response.data.eval }));
      setLeads(prev => prev.map(lead => lead.id === selectedLeadId ? { ...lead, ...response.data.updatedLead } : lead));
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
    setActionError({ contact: null, identity: null });
    setActionEval({ identity: null, contact: null });
    API.post(`/leads/${selectedLeadId}/enrich/contact`, {
      existingData: {}
    }).then(response => {
      console.log('Enrichment successful:', response.data);
      setActionEval(prev => ({ ...prev, contact: response.data.eval }));
      setLeads(prev => prev.map(lead => lead.id === selectedLeadId ? { ...lead, ...response.data.updatedLead } : lead));
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

  const handlePriorityChange = (priority) => {
    if (!selectedLeadId) return;

    API.patch(`/leads/${selectedLeadId}/priority`, { priority })
    .then(response => {
      setSelectedLead(response.data);
      setLeads(prev => prev.map(lead => lead.id === selectedLeadId ? response.data : lead));
    })
    .catch(error => {
      console.error('Error updating lead priority:', error);
    });
  };

  return (<div className='card'>
    <div className='card-header d-flex justify-content-start'>
      <div className='d-flex flex-column justify-content-center gap-2 pe-3 me-3 border-end'>
        <button 
          className={`btn btn-sm btn-outline-success ${selectedLead?.priority === 'HIGH' ? 'active' : ''}`}
          onClick={() => handlePriorityChange('HIGH')}
          disabled={!selectedLeadId}
        >
          High
        </button>
        <button 
          className={`btn btn-sm btn-outline-warning ${selectedLead?.priority === 'MEDIUM' ? 'active' : ''}`} 
          onClick={() => handlePriorityChange('MEDIUM')}
          disabled={!selectedLeadId}
        >
          Med
        </button>
        <button 
          className={`btn btn-sm btn-outline-secondary ${selectedLead?.priority === 'LOW' ? 'active' : ''}`} 
          onClick={() => handlePriorityChange('LOW')}
          disabled={!selectedLeadId}
        >
          Low
        </button>
      </div>
      <div className='d-flex flex-column'>
        <h1>{selectedLead ? selectedLead.name : "Lead Details"}</h1>
        <p className='text-muted m-0 mb-2'>{selectedLead ? selectedLead.location : "Select a lead to view details"}</p>
        {selectedLead && <ListManagerDropdown lead={selectedLead} lists={lists} />}
      </div>
    </div>

    {selectedLead ? (<>
      <div className='ps-2 d-flex flex-column justify-content-center py-2'>
        <h5>Explore Sources</h5>
        <p className='mb-1'>
          <span className='me-1'>Website:</span>
          <a href={selectedLead?.website || null} target='_blank' rel='noopener noreferrer'>{selectedLead?.website || "Not Available"}</a>
        </p>
        <p className='mb-1'>
          <span className='me-1'>Maps URL:</span>
          <a href={selectedLead?.mapsUrl || null} target='_blank' rel='noopener noreferrer'>{selectedLead?.mapsUrl || "Not Available"}</a>
        </p>
      </div>

      <div className='p-2 border-top'>
        <button
          className='btn btn-outline-secondary ms-2'
          onClick={() => openEdit()}
          title='Edit lead manually'
        >
          <FontAwesomeIcon icon={faPen} className='me-1' />
          <span className='d-none d-md-inline'>Edit Manually</span>
        </button>
      </div>

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
          <div className="col-12 col-md-6 border p-0">
            <div className='d-flex align-items-center border-bottom p-2 justify-content-between'>
              <h5 className='m-0'>Identity</h5>
              <div className='d-flex flex-column align-items-end'>
                <button 
                  className={`btn btn-outline-${selectedLead.identityComplete ? 'success' : 'primary'}`}
                  onClick={() => handleIdentityEnrichment()}
                  disabled={selectedLead.identityComplete || actionLoading.identity}
                >
                  Explore Identity
                  {actionLoading.identity 
                    ? <div className="spinner-border spinner-border-sm ms-1" role="status" /> 
                    : <FontAwesomeIcon icon={selectedLead.identityComplete ? faCheck : faMagnifyingGlass} className='ms-2' />
                  }
                </button>
                {actionLoading.identity && <EnrichmentLog leadId={selectedLeadId} goal={'IDENTITY'}/>}
              </div>
            </div>

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

          <div className="col-12 col-md-6 border p-0">
            <div className='d-flex align-items-center justify-content-between border-bottom p-2'>
              <h5 className="m-0">Contact</h5>
              <div className='d-flex flex-column align-items-end'>
                <button 
                  className={`justify-self-end btn btn-outline-${selectedLead.contactComplete ? 'success' : 'primary'}`}
                  onClick={() => handleContactEnrichment()}
                  disabled={selectedLead.contactComplete || actionLoading.contact}
                >
                  Explore Contact
                  {actionLoading.contact 
                    ? <div className="spinner-border spinner-border-sm ms-1" role="status" /> 
                    : <FontAwesomeIcon icon={selectedLead.contactComplete ? faCheck : faMagnifyingGlass} className='ms-2' />
                  }
                </button>
                {actionLoading.contact && <EnrichmentLog leadId={selectedLeadId} goal={'CONTACT'}/>}
              </div>
            </div>
            {actionEval.contact && <div className={`text-${actionEval.contact.completed ? 'success' : 'danger'} ms-3`}>{actionEval.contact.reason}</div>}
            <div className='p-2 d-flex flex-column p-0'>
              <div className='flex-grow-1 d-flex'>
                <a href={`tel:${selectedLead.phone}`} className={`btn rounded-circle btn-outline-${selectedLead.phone ? 'success' : 'secondary disabled'}`}>
                  <FontAwesomeIcon icon={faPhone} />
                </a>
                <a href={`mailto:${selectedLead.email}`} className={`ms-2 btn rounded-circle btn-outline-${selectedLead.email ? 'success' : 'secondary disabled'}`}>
                  <FontAwesomeIcon icon={faEnvelope} />
                </a>
                <a href={`${selectedLead.instagram}`} className={`ms-2 btn rounded-circle btn-outline-${selectedLead.instagram ? 'success' : 'secondary disabled'}`}>
                  <FontAwesomeIcon icon={faInstagram} />
                </a>
                <a href={`${selectedLead.tiktok}`} className={`ms-2 btn rounded-circle btn-outline-${selectedLead.tiktok ? 'success' : 'secondary disabled'}`}>
                  <FontAwesomeIcon icon={faTiktok} />
                </a>
                <a href={`${selectedLead.facebook}`} className={`ms-2 btn rounded-circle btn-outline-${selectedLead.facebook ? 'success' : 'secondary disabled'}`}>
                  <FontAwesomeIcon icon={faFacebook} />
                </a>
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
        </div>
      </div>
    </>) : (
      <p>No lead selected</p>
    )}
  </div>)
}

export default LeadDetails