// components/LeadSidebar.jsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLeads } from '../../context/LeadContext';
import { faChevronLeft, faChevronRight, faMinus, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import React, {useState, useEffect, useRef, useMemo} from 'react';
import gsap from 'gsap';
import '../../styles/components/LeadsStyles.css'

export default function LeadSidebar() {
  const { leads, selectLead, selectedLeadId, 
    addLead, deleteLead,
    lists, selectList, selectedListId, 
    addList, deleteList,
    dataLoading, actionLoading, actionError,
    countLeadsByList
  } = useLeads();

  const [isOpen, setIsOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    location: '',
    website: '',
  });

  const [showListInput, setShowListInput] = useState(false);
  const [newListName, setNewListName] = useState('');

  const sidebarRef = useRef(null);
  const selectedLeadRef = useRef(null);
  const prevSelectedId = useRef(null);

  useEffect(() => {
    if (!sidebarRef.current) return;
    gsap.to(sidebarRef.current, {
      width: isOpen ? 300 : 0,
      duration: 0.3,
      ease: 'power2.inOut',
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

    if (!newLead.name || !newLead.location ) {
      return;
    }

    // Add the new lead
    try {
      await addLead(newLead, setShowAddForm, setNewLead);
    } catch (error) {
      console.error('Failed to add lead:', error);
    }
  };

  return (<div className="d-flex border-end h-100 position-sidebar">
    <button className="btn btn-outline-light rounded-0 border-end px-3" onClick={() => setIsOpen(!isOpen)}>
      <FontAwesomeIcon icon={isOpen ? faChevronRight : faChevronLeft} className='text-primary' />
    </button>

    <div className='bg-light h-100' style={{ width: 300, overflowY: 'auto' }} ref={sidebarRef}>
      <div className="d-flex align-items-center gap-2 p-2 border-bottom">
        <select
          className="form-select form-select-sm"
          value={selectedListId}
          onChange={(e) => {
            console.log('Selected List ID:', e.target.value);
            selectList(e.target.value)
          }}
        >
          <option value={null}>All leads</option>
          {lists.map(l => (
            <option key={l.id} value={l.id}>
              {l.name} ({countLeadsByList(l.id)})
            </option>
          ))}
        </select>
        <button className="btn btn-sm btn-outline-secondary text-nowrap" onClick={() => setShowListInput(!showListInput)}>
          <FontAwesomeIcon icon={showListInput ? faMinus : faPlus} />
        </button>
      </div>

      {showListInput && (
        <div className='p-2 border-bottom'>
          <form className="p-3 card bg-white" onSubmit={(e) => {
            e.preventDefault();
            handleCreateList();
          }}>
            <label htmlFor="listName">List Name</label>
            <input
              id='listName'
              required
              type="text"
              placeholder="Enter list name"
              className="form-control mb-2"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
            />
            <div className='d-flex gap-2'>
              <button type="submit" className="btn btn-primary flex-grow-1">Create List</button>
              <button type="button" className="btn btn-outline-secondary flex-grow-2" onClick={() => setShowListInput(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="d-flex justify-content-between border-bottom p-2">
        <h5 className='m-0'>Leads</h5>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
          <FontAwesomeIcon icon={showAddForm ? faMinus : faPlus} />
        </button>
      </div>

      {showAddForm && (<div className='p-2 border-bottom'>
        <form className="p-3 card bg-white" onSubmit={(e) => handleAddLead(e)}>
          <label htmlFor="name">Name</label>
          <input 
            id='name' 
            required 
            type="text" 
            placeholder="lead's name" 
            className="form-control mb-2" 
            value={newLead.name} 
            onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} 
          />
          <label htmlFor="website">Website</label>
          <input 
            id='website' 
            type="text" 
            placeholder="website (optional)" 
            className="form-control mb-2" 
            value={newLead.website} 
            onChange={(e) => setNewLead({ ...newLead, website: e.target.value })} 
          />
          <label htmlFor="location">Location</label>
          <input 
            id='location' 
            required 
            type="text" 
            placeholder="lead's location (city, country)" 
            className="form-control mb-2 " 
            value={newLead.location} 
            onChange={(e) => setNewLead({ ...newLead, location: e.target.value })} 
          />

          <div className='d-flex gap-2'>
            <button type="submit" className="btn btn-primary flex-grow-1">{actionLoading ? <div className="spinner-border spinner-border-sm" role="status" /> : 'Add Lead +'}</button>
            <button type="button" className="btn btn-outline-secondary flex-grow-2" onClick={() => {
              setShowAddForm(false)
              setNewLead({
                name: '',
                website: '',
                location: '',
              });
            }}>Cancel</button>
          </div>
          {actionError && <div className="text-danger mt-2">{actionError}</div>}
        </form>
      </div>)}

      {dataLoading && <div className="text-center p-3"><div className="spinner-border" role="status"></div></div>}

      {leads.map((lead, index) => (
        <div
          className={`d-flex justify-content-between p-2 sidebar-lead border-bottom ${lead.id === selectedLeadId ? 'bg-white' : ''}`}
          key={index}
          onClick={() => {
            selectLead(lead.id);
            setIsOpen(false);
          }}
        >
          <div ref={lead.id === selectedLeadId ? selectedLeadRef : null}>
            <div>
              {lead.lists.length > 0 && lead.lists.map((list) => (
                <span key={list.id} className="badge bg-secondary me-1 mb-1">{list.name}</span>
              ))}
            </div>
            <h6 className='m-0'>{lead.name}</h6>
            <small className='text-muted'>{lead.location}</small>
          </div>

          <button className="btn btn-outline-danger btn-sm align-self-center" style={{height: "min-content"}} onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Are you sure you want to delete the lead "${lead.name}"?`)) {
              deleteLead(lead.id);
            }
          }}>
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      ))}
    </div>
  </div>);
}
