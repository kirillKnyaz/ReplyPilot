import { useState, useEffect, use } from 'react'
import MapContainer from './MapContainer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faCheck, faCrown, faEllipsis, faExternalLink, faExternalLinkAlt, faFloppyDisk, faGlobe, faMagnifyingGlass, faRepeat, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import API from '../../api';
import useAuth from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { useLeads } from '../../context/LeadContext';

const PLACE_CATEGORIES = [
  { value: "car_repair", label: "Car Repair" },
  { value: "beauty_salon", label: "Beauty Salon" },
  { value: "restaurant", label: "Restaurant" },
  { value: "bar", label: "Bar" },
  { value: "gym", label: "Gym" },
  { value: "plumber", label: "Plumber" },
  { value: "electrician", label: "Electrician" },
  { value: "laundry", label: "Laundry" },
  { value: "chiropractor", label: "Chiropractor" },
  { value: "real_estate_agency", label: "Real Estate" },
  { value: "lawyer", label: "Lawyer" },
  { value: "veterinary_care", label: "Veterinary" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "hardware_store", label: "Hardware Store" },
  { value: "clothing_store", label: "Clothing Store" },
  { value: "florist", label: "Florist" },
  { value: "dentist", label: "Dentist" },
  { value: "moving_company", label: "Moving Company" },
  { value: "storage", label: "Storage" },
  { value: "event_venue", label: "Event Venue" }
];

function DiscoverLeadsMap({ discovery, setDiscovery }) {
  const { user, updateUserSubscription } = useAuth();
  const { addLead, selectLead, actionLoading, actionError, leads } = useLeads();

  const {
    searchToggle, selectedCategory, textSearchQuery, maxResultCount,
    selectedPlace, searchButtonVisible, nearbySearchLoading, nearbySearchError,
    places, selectedBusiness, completionLoading, completionError, 
    history, historyLoading, historyError
  } = discovery;

  const set = (patch) => setDiscovery(prev => ({ ...prev, ...patch }));

  useEffect(() => {
    set({ searchButtonVisible: false });
    if (searchToggle) {
      if (selectedPlace) {
        set({ searchButtonVisible: true });
      }
    } else {
      if (textSearchQuery.trim() !== '' && selectedPlace) {
        set({ searchButtonVisible: true });
      } else {
        set({ searchButtonVisible: false });
      }
    }

  }, [selectedPlace, selectedCategory, textSearchQuery, maxResultCount, searchToggle]);

  const loadHistory = async () => {
    set({ historyLoading: true, historyError: null });
    try {
      const res = await API.get('/search/history?limit=20');
      set({ history: res.data });
    } catch (e) {
      set({ historyError: 'Failed to load search history' });
    } finally {
      set({ historyLoading: false });
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const handleNearbySearch = async () => {
    set({ searchButtonVisible: false, nearbySearchLoading: true, nearbySearchError: null });
    
    const { lat, lng, zoom } = selectedPlace;
    const radius = (156543.03392 * Math.cos(lat * Math.PI / 180)) / Math.pow(2, zoom) * 100;

    API.get(`/search/nearby?lat=${lat}&lng=${lng}&radius=${radius}&category=${selectedCategory}&requestedTokens=${maxResultCount}`)
      .then((response) => {
        set({ places: response.data.places });
        updateUserSubscription(response.data.updatedSubscription);
        loadHistory();
      })
      .catch((error) => set({
        nearbySearchError: (error.response && error.response.data && error.response.data.message) || "Failed to fetch places"
      }))
      .finally(() => set({ nearbySearchLoading: false }));
  };

  const handleTextSearch = async () => {
    set({ searchButtonVisible: false, nearbySearchLoading: true, nearbySearchError: null });

    const { lat, lng, zoom } = selectedPlace;
    const radius = (156543.03392 * Math.cos(lat * Math.PI / 180)) / Math.pow(2, zoom) * 100; // meters

    API.get(`/search/text?lat=${lat}&lng=${lng}&radius=${radius}&query=${textSearchQuery}&requestedTokens=${maxResultCount}`)
    .then((response) => {
      console.log("Text search response data:", response.data);
      set({ places: response.data.places });
      updateUserSubscription(response.data.updatedSubscription);
      loadHistory();
    }).catch((error) => {
      console.error("Error fetching text search results:", error);
      set({ nearbySearchError: error.response.data.message || "Failed to fetch text search results" });
    }).finally(() => {
      set({ nearbySearchLoading: false, textSearchQuery: '' });
    });
  }

  const handleSaveLead = () => {
    if (!selectedBusiness) {
      console.error("No business selected to save as lead");
      return;
    }

    const place = places.find(p => p.id === selectedBusiness);
    if (!place) {
      console.error("Selected business not found in places list");
      return;
    }

    const leadData = {
      name: place.displayName.text,
      website: place.websiteUri || null,
      location: `${place.addressComponents ? place.addressComponents[4]?.longText : ''} ${place.addressComponents ? place.addressComponents[3]?.longText : ''}`,
      additionalData: {
        googleMapsUri: place.googleMapsUri,
        placesId: place.id,
      }
    };

    console.log("Saving lead data:", leadData);
    addLead(leadData);
  }

  const handleTextSearchCompletion = () => {
    set({ completionLoading: true, completionError: null });
    
    API.get('/leads/generateQuery').then((response) => {
      const query = response.data.query;
      set({ textSearchQuery: query });
      console.log("Generated search query:", query);
    }).catch((error) => {
      console.error("Error generating search query:", error);
      set({ completionError: error.response.data.error || "Failed to generate search query" });
    }).finally(() => {
      set({ completionLoading: false });
    });
  }

  const estimateAvailableRequests = () => {
    if (!user || !user.subscription) return 0;

    const tokens = user.subscription.searchTokens;
    const requests = Math.floor(tokens / maxResultCount);
    return requests > 0 ? requests : 0;
  }

  const getSearchHistory = () => {
    API.get('/search/history')
  }

  return (<div className='container-fluid'>
    <div className='col-12'>
      {/* Map Controls */}
      <button className='btn btn-outline-secondary me-2 mb-3' onClick={() => set({ searchToggle: !searchToggle })}>
        Switch to {searchToggle ? 'Text Search' : 'Nearby Search'}
      </button>

      <nav className='d-flex flex-nowrap mb-3'>
        {searchToggle 
        ? <select name="business_type" id="business_type" value={selectedCategory} onChange={(e) => {
          set({ selectedCategory: e.target.value });
          localStorage.setItem('selectedCategory', e.target.value);
        }} className='form-select me-2'>
          {PLACE_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select> 
        : <div className='input-group me-2'>
          <input type='text' value={textSearchQuery} onChange={(event) => set({ textSearchQuery: event.target.value })} className='form-control' placeholder='Search...' />
          <button className='btn btn-outline-secondary' onClick={() => handleTextSearchCompletion()} disabled={completionLoading}>
            {completionLoading ? <div className='spinner-border spinner-border-sm' role='status' 
            /> : <FontAwesomeIcon icon={faWandMagicSparkles}/>}
          </button>
        </div>}

        <div className='input-group' style={{ minWidth: 'max-content', maxWidth: 'max-content' }}>
          <span className='input-group-text'>Max Results</span>
          <input type="number" className='form-control' max={20} placeholder='Max results' value={maxResultCount} onChange={(e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value) && value > 0) {
              set({ maxResultCount: value });
            }
          }}/>
        </div>
      </nav>
      {completionError && <div className='text-danger m-0 my-3 d-flex align-items-center'>{completionError} <button className='btn p-0 m-0 ms-2' onClick={() => set({ completionError: null })}>x</button></div>}        

      {/* Map Container */}
      <MapContainer updateSelectedPlace={(val) => set({ selectedPlace: val })} places={places} selectedBusiness={selectedBusiness}/>
      <div className="d-flex align-items-center justify-content-between mt-3 gap-2">
        <button 
          className='btn btn-primary' 
          onClick={() => {
            if (searchToggle) handleNearbySearch();
            else handleTextSearch();
          }} 
          disabled={!searchButtonVisible || user.subscription.searchTokens < maxResultCount}
        >
          Search
        </button> 
        {nearbySearchLoading && <div className='spinner-border'/>}
        {user && user.subscription && <div className='d-flex justify-content-between align-items-center'>
          <div className={`${user.subscription.searchTokens < maxResultCount ? 'text-danger' : ''}`}>
            {user.subscription.searchTokens} search tokens available (~{estimateAvailableRequests()} requests)
          </div>
          {user.subscription.searchTokens < maxResultCount && <Link to="/billing" className='btn btn-warning'>
            Upgrade Plan
            <FontAwesomeIcon icon={faCrown} className='ms-2'/>
          </Link>}
        </div>}  
      </div>
      {nearbySearchError && <div className='text-danger mt-2'>{nearbySearchError}</div>}
    </div>

    <div className='d-flex col-12'>
      <div className='container d-flex flex-column align-items-center mt-4' style={{overflowY: "auto"}}>
        {places && places.map((place, index) => (
          <div className='d-flex flex-column w-100 p-2 border-bottom' key={place.id}>
            <div className='d-flex justify-content-between w-100'>
              <span><span className='me-2'>{index + 1}</span>{place.displayName.text}</span>
              <button className='btn m-0 p-0 px-2' onClick={() => {
                if (selectedBusiness === place.id) {
                  set({ selectedBusiness: null });
                  return;
                }
                set({ selectedBusiness: place.id });
              }}>
                <FontAwesomeIcon icon={faGlobe} className={`${place.websiteUri ? 'text-success' : 'text-danger'}`}/>
                <FontAwesomeIcon icon={selectedBusiness === place.id ? faArrowUp : faArrowDown} className={'ms-2 text-secondary'}/>
              </button>
            </div>

            {selectedBusiness === place.id && (
              <div className='d-flex align-items-center justify-content-between mt-2 w-100 border-muted border-top'>
                <div className='d-flex flex-column me-3 flex-grow-1'>
                  <p 
                    className='text-muted m-0' 
                    style={{ fontSize: '0.9rem' }}
                  >
                    {place.addressComponents ? `${place.addressComponents[4].longText} - ${place.addressComponents[3].longText}` : 'N/A'}
                  </p>
                  <a 
                    href={place.googleMapsUri} 
                    target="_blank" rel="noopener noreferrer" 
                    className='m-0 '
                    style={{ fontSize: '0.9rem' }}
                  >
                    Google Maps <FontAwesomeIcon icon={faExternalLink} />
                  </a>
                  <a 
                    href={place.websiteUri} 
                    target="_blank" rel="noopener noreferrer" 
                    className='m-0 '
                    style={{ fontSize: '0.9rem' }}
                  >
                    {place.websiteUri} <FontAwesomeIcon icon={faExternalLink} />
                  </a>
                </div>

                {leads.find((lead) => lead.placesId === place.id) 
                  ? <button className='btn btn-success' disabled>
                    Saved <FontAwesomeIcon icon={faCheck} className='ms-1'/>
                  </button>
                  : <button className='btn btn-primary' onClick={() => handleSaveLead()} disabled={actionLoading }>
                    Save {actionLoading 
                      ? <div className='spinner-border spinner-border-sm ms-1' role='status' /> 
                      : <FontAwesomeIcon icon={leads.find((lead) => lead.placesId === place.id) ? faCheck : faFloppyDisk} className='ms-1'/>
                    }
                  </button>
                }
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    <div className='d-flex col-12'>
      <div className='container d-flex flex-column mt-4' style={{ overflowY: "auto", maxHeight: 320 }}>
        <h5 className='mb-3'>Search History</h5>
        {discovery.historyLoading && <div className='text-muted'>Loading…</div>}
        {discovery.historyError && (
          <div className='text-danger d-flex align-items-center'>
            {discovery.historyError}
            <button className='btn btn-link p-0 ms-2' onClick={loadHistory}>Retry</button>
          </div>
        )}
        {!discovery.historyLoading && !discovery.historyError && discovery.history.length === 0 && (
          <div className='text-muted'>No history yet. Run a search to populate this.</div>
        )}

        <ul className='list-group'>
          { discovery.history.map((h) => {
            const when = new Date(h.createdAt).toLocaleString();
            const summary = h.type === 'NEARBY'
              ? `${h.type} • ${h.category} • r=${h.radiusMeters}m`
              : `${h.type} • “${h.textQuery}” • r=${h.radiusMeters}m`;
            return (
              <li key={h.id} className='list-group-item d-flex justify-content-between align-items-center'>
                <div className='me-2'>
                  <div className='fw-semibold'>{summary}</div>
                  <div className='small text-muted'>
                    {when} • {h.placesCount} places • @({h.centerLat.toFixed(4)}, {h.centerLng.toFixed(4)})
                  </div>
                </div>
                <div className='d-flex gap-2'>
                  <button
                    className='btn btn-outline-secondary btn-sm'
                    title='Load saved results (no API cost)'
                    onClick={() => {
                      // Rehydrate UI from saved JSON
                      set({
                        places: h.results || [],
                        selectedBusiness: null,
                        selectedPlace: { lat: h.centerLat, lng: h.centerLng, zoom: 14 }, // default zoom
                        selectedCategory: h.category || discovery.selectedCategory,
                        textSearchQuery: h.textQuery || discovery.textSearchQuery,
                      });
                    }}
                  >
                    Load
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  </div>)
}

export default DiscoverLeadsMap;