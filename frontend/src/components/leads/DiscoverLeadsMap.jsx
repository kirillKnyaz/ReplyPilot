import { useState, useEffect } from 'react'
import MapContainer from './MapContainer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faCrown, faEllipsis, faGlobe, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import API from '../../api';
import useAuth from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

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
  { value: "event_venue", label: "Event Venue" },
  { }
];

function DiscoverLeadsMap() {
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState(localStorage.getItem('selectedCategory') || 'restaurant');
  const [maxResultCount, setMaxResultCount] = useState(10);

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searchButtonVisible, setSearchButtonVisible] = useState(false);
  const [nearbySearchLoading, setNearbySearchLoading] = useState(false);
  const [nearbySearchError, setNearbySearchError] = useState(null);

  const [places, setPlaces] = useState([]);

  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const scrapeLoading = false;

  useEffect(() => {
    if (selectedPlace) {
      setSearchButtonVisible(true);
    }
  }, [selectedPlace, selectedCategory]);

  const handleNearbySearch = async () => {
    setSearchButtonVisible(false);
    setNearbySearchLoading(true);
    
    const { lat, lng, zoom } = selectedPlace;
    const radius = (156543.03392 * Math.cos(lat * Math.PI / 180)) / Math.pow(2, zoom) * 100; // meters

    API.get(`/search/nearby?lat=${lat}&lng=${lng}&radius=${radius}&category=${selectedCategory}&requestedTokens=${maxResultCount}`)
    .then((response) => {
      console.log("Response data:", response.data);
      setPlaces(response.data.places);
    }).catch((error) => {
      console.error("Error fetching places:", error);
      setNearbySearchError(error.response.data.message || "Failed to fetch places");
    }).finally(() => {
      setNearbySearchLoading(false);
    });
  };

  return (<>
    <div className='container-fluid d-flex'>
      <div className='w-100' style={{ height: 'max-content' }}>
        {/* Map Controls */}
        <nav className='d-flex flex-nowrap mb-3'>
          <select name="business_type" id="business_type" value={selectedCategory} onChange={(e) => {
            setSelectedCategory(e.target.value);
            localStorage.setItem('selectedCategory', e.target.value);
          }} className='form-select me-2'>
            {PLACE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          
          <div className='input-group flex-grow-1'>
            <span className='input-group-text'>Max Results</span>
            <input type="number" className='form-control' placeholder='Max results' value={maxResultCount} onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value > 0) {
                setMaxResultCount(value);
              }
            }}/>
          </div>
        </nav>

        {user && user.subscription && <div className='d-flex justify-content-between align-items-center mb-3'>
          <div className={`${user.subscription.searchTokens < maxResultCount ? 'text-danger' : ''}`}>
            {user.subscription.searchTokens} search tokens available
          </div>
          {user.subscription.searchTokens < maxResultCount && <Link to="/billing" className='btn btn-warning'>
            Upgrade Plan
            <FontAwesomeIcon icon={faCrown} className='ms-2'/>
          </Link>}
        </div>}

        {/* Map Container */}
        <MapContainer updateSelectedPlace={setSelectedPlace} places={places} selectedBusiness={selectedBusiness}/>
        <div className="d-flex align-items-center mt-3 gap-2">
          <button 
            className='btn btn-primary' 
            onClick={() => handleNearbySearch()} 
            disabled={!searchButtonVisible || user.subscription.searchTokens < maxResultCount}
          >
            Search
          </button> 
          {nearbySearchLoading && <div className='spinner-border'/>}      
        </div>
        {nearbySearchError && <div className='text-danger mt-2'>{nearbySearchError}</div>}
      </div>

      <div className='container d-flex flex-column align-items-center mt-4' style={{overflowY: "auto", height: '400px'}}>
        {places && places.map((place, index) => (
          <div className='d-flex flex-column w-100 p-2 border-bottom' key={place.id}>
            <div className='d-flex justify-content-between w-100'>
              <span><span className='me-2'>{index + 1}</span>{place.displayName.text}</span>
              <button className='btn m-0 p-0 px-2' onClick={() => {
                if (selectedBusiness === place.id) {
                  setSelectedBusiness(null);
                  return;
                }
                setSelectedBusiness(place.id)
              }}>
                <FontAwesomeIcon icon={faGlobe} className={`${place.websiteUri ? 'text-success' : 'text-danger'}`}/>
                <FontAwesomeIcon icon={selectedBusiness === place.id ? faArrowUp : faArrowDown} className={'ms-2 text-secondary'}/>
              </button>
            </div>

            {selectedBusiness === place.id && (
              <div className='d-flex align-items-center justify-content-between mt-2'>
                <button className='btn btn-primary py-1'>
                  {scrapeLoading ? <div className='spinner-border text-white' style={{ width: '1rem', height: '1rem' }}/> : !place.websiteUri ? 'No Website' : 'Analyse Website'}
                </button>

                <button className='btn btn-secondary ms-2 py-1'>
                  <span className='me-2'>Social media</span>
                  <FontAwesomeIcon icon={faMagnifyingGlass}/>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </>)
}

export default DiscoverLeadsMap;