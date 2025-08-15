import { useEffect, useState } from 'react';
import API from '../../api';
import { useLeads } from '../../context/LeadContext';

export default function ListManagerDropdown({ lead, lists }) {
  const { setLeads } = useLeads();

  const toggle = (listId, listName, add) => {
    setLeads((prevLeads) => {
      return prevLeads.map((l) => {
        if (l.id === lead.id) {
          return {
            ...l,
            lists: add
              ? [...l.lists, { id: listId, name: listName }]
              : l.lists.filter((list) => list.id !== listId),
          };
        }
        return l;
      });
    });

    if (add) {
      API.post('/lists/subscribe', { listId, leadId: lead.id }).catch((error) => {
        console.error('Failed to subscribe:', error);
      });
    } else {
      API.post('/lists/unsubscribe', { listId, leadId: lead.id }).catch((error) => {
        console.error('Failed to unsubscribe:', error);
      });
    }
  }

  return (
    <div className="dropdown">
      <button
        className="btn btn-outline-secondary btn-sm dropdown-toggle"
        data-bs-toggle="dropdown"
      >
        Organize
      </button>
      <div className="dropdown-menu p-2" style={{ minWidth: 220 }}>
        {lists.map(list => {
          return (
            <label key={list.id} className="dropdown-item d-flex align-items-center gap-2">
              <input
                type="checkbox"
                checked={lead.lists.some((leadLists) => leadLists.id === list.id)}
                onChange={(e) => toggle(list.id, list.name, e.target.checked)}
              />
              <span>{list.name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}