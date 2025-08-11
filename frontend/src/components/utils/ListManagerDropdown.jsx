import { useEffect, useState } from 'react';
import { getLists, getList, addLeadToList, removeLeadFromList } from '../../api/listsClient';

export default function ListManagerDropdown({ leadId }) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState([]);
  const [membership, setMembership] = useState(new Set());

  useEffect(() => {
    (async () => {
      try {
        const ls = await getLists();
        console.log('Fetched lists:', ls);
        setLists(ls);
        // load membership lazily (first open)
      } catch (e) { console.error(e); }
    })();
  }, []);

  async function ensureMembershipLoaded() {
    if (membership.size > 0) return;
    try {
      const inLists = [];
      // quick approach: fetch each list detail and check if lead is present
      // (If this becomes heavy, add a dedicated /leads/:id/lists endpoint)
      await Promise.all(lists.map(async (l) => {
        const detail = await getList(l.id);
        if (detail.leads.some(x => x.leadId === leadId)) inLists.push(l.id);
      }));
      setMembership(new Set(inLists));
    } catch (e) { console.error(e); }
  }

  async function toggle(listId, checked) {
    try {
      if (checked) {
        await addLeadToList(listId, leadId);
        window.dispatchEvent(new CustomEvent('lists:added', { detail: { listId, leadId } }));
        setMembership(prev => new Set(prev).add(listId));
      } else {
        await removeLeadFromList(listId, leadId);
        window.dispatchEvent(new CustomEvent('lists:removed', { detail: { listId, leadId } }));
        setMembership(prev => {
          const next = new Set(prev);
          next.delete(listId);
          return next;
        });
      }
    } catch (e) {
      console.error('toggle failed', e);
    }
  }

  return (
    <div className="dropdown">
      <button
        className="btn btn-outline-secondary btn-sm dropdown-toggle"
        data-bs-toggle="dropdown"
        onClick={ensureMembershipLoaded}
      >
        Organize
      </button>
      <div className="dropdown-menu p-2" style={{ minWidth: 220 }}>
        {lists.length === 0 && <div className="px-2 text-muted">No lists</div>}
        {lists.map(l => {
          const checked = membership.has(l.id);
          return (
            <label key={l.id} className="dropdown-item d-flex align-items-center gap-2">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => toggle(l.id, e.target.checked)}
              />
              <span>{l.name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}