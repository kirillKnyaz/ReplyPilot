// components/LeadSidebar.jsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLeads } from '../../context/LeadContext';
import { faChevronLeft, faChevronRight, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import React, {useState, useEffect, useRef} from 'react';
import gsap from 'gsap';
import '../../styles/components/LeadsStyles.css'

export default function LeadSidebar() {
  const { leads, selectLead, selectedLeadId, addLead, dataLoading, actionLoading, actionError } = useLeads();

  const [isOpen, setIsOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    website: '',
    email: '',
    phone: '',
    notes: '',
  });

  const sidebarRef = useRef(null);
  const selectedLeadRef = useRef(null);
  const prevSelectedId = useRef(null);

  useEffect(() => {
    if (!sidebarRef.current) return;
    gsap.to(sidebarRef.current, {
      width: isOpen ? 300 : 0,
      duration: 0.3,
      ease: 'power2.inOut',
      overflow: 'hidden',
    });
  }, [isOpen]);

  useEffect(() => {
    // Only run animation if selected lead actually changed
    if (selectedLeadId && selectedLeadId !== prevSelectedId.current && selectedLeadRef.current) {
      gsap.fromTo(
        selectedLeadRef.current,
        { x: 0 },
        { x: 8, duration: 0.2, ease: 'power2.out',}
      );

      gsap.to(prevSelectedId.current, {
        x: 0,
        duration: 0.2,
        ease: 'power2.out'
      });
    }
    prevSelectedId.current = selectedLeadRef.current;
  }, [selectedLeadId]);

  const handleAddLead = async (e) => {
    e.preventDefault();

    if (!newLead.name || !newLead.website || !newLead.email ) {
      return;
    }

    // Add the new lead
    await addLead(newLead);
    setNewLead({
      name: '',
      website: '',
      email: '',
      phone: '',
      notes: '',
    });
    setShowAddForm(false);
  };

  return (<div className={`d-flex border-end h-100`}>
    <button className="btn btn-outline-light rounded-0 border-end px-3" onClick={() => setIsOpen(!isOpen)}>
      <FontAwesomeIcon icon={isOpen ? faChevronRight : faChevronLeft} className='text-primary' />
    </button>
    <div className='bg-light' style={{ width: 300, overflowY: 'auto' }} ref={sidebarRef}>
      <div className="d-flex justify-content-between border-bottom p-2">
        <h5 className='m-0'>Leads</h5>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
          <FontAwesomeIcon icon={showAddForm ? faMinus : faPlus} />
        </button>
      </div>

      {showAddForm && (<div className='p-2 border-bottom'>
        <form className="p-3 card bg-white" onSubmit={(e) => handleAddLead(e)}>
          <input required type="text" placeholder="name" className="form-control mb-2" value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} />
          <input required type="text" placeholder="website" className="form-control mb-2" value={newLead.website} onChange={(e) => setNewLead({ ...newLead, website: e.target.value })} />
          <input required type="email" placeholder="email" className="form-control mb-2 " value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} />
          <input type="text" placeholder="phone" className="form-control mb-2" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} />
          <textarea placeholder="notes" className="form-control mb-2" value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}></textarea>

          <div className='d-flex gap-2'>
            <button type="submit" className="btn btn-primary flex-grow-1">{actionLoading ? <div className="spinner-border spinner-border-sm" role="status" /> : 'Add Lead +'}</button>
            <button type="button" className="btn btn-outline-secondary flex-grow-2" onClick={() => {
              setShowAddForm(false)
              setNewLead({
                name: '',
                website: '',
                email: '',
                phone: '',
                notes: '',
              });
            }}>Cancel</button>
          </div>
          {actionError && <div className="text-danger mt-2">{actionError}</div>}
        </form>
      </div>)}

      {leads.map((lead, index) => (
        <div
          className={`p-2 sidebar-lead border-bottom ${lead.id === selectedLeadId ? 'bg-white' : ''}`}
          key={index}
          onClick={() => {selectLead(lead.id)}}
        >
          <div ref={lead.id === selectedLeadId ? selectedLeadRef : null}>
            <h6 className='m-0'>{lead.name}</h6>
            <small className='text-muted'>{lead.email}</small>
          </div>
        </div>
      ))}
    </div>
  </div>);
}
