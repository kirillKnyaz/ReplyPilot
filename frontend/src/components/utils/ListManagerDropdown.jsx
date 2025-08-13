import { useEffect, useState } from 'react';
import API from '../../api';

export default function ListManagerDropdown({ lead, lists }) {

  const toggle = (listId, listName, add) => {
    if (add) {
      API.post('/lists/subscribe', { listId, leadId: lead.id }).then((response) => {
        console.log('Subscribed to list:', response.data);
        lead.lists.push({ id: listId, name: listName });
      });
    } else {
      API.post('/lists/unsubscribe', { listId, leadId: lead.id }).then((response) => {
        console.log('Unsubscribed from list:', { listId, leadId: lead.id });
        lead.lists = lead.lists.filter((list) => list.id !== listId);
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
          const checked = lead.lists.some((leadLists) => leadLists.id === list.id)
          return (
            <label key={list.id} className="dropdown-item d-flex align-items-center gap-2">
              <input
                type="checkbox"
                checked={checked}
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