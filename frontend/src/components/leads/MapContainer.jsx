import React, { useState } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faLocationPin} from "@fortawesome/free-solid-svg-icons";

function MapContainer({ updateSelectedPlace, places, selectedBusiness }) {
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const [selectedMarker, setSelectedMarker] = useState({ lat: 45.508888, lng: -73.561668 }); // default: Montreal
  const [selectedInfoWindow, setSelectedInfoWindow] = useState(null);

  const handleMapClick = (event) => {
    const lat = event.detail.latLng.lat;
    const lng = event.detail.latLng.lng;
    const zoom = event.map.zoom;
    setSelectedMarker({ lat, lng });
    updateSelectedPlace({ lat, lng, zoom });
  };

  return (<>
    <div style={{ width: "100%", height: "100%" }}>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} onLoad={() => console.log("Google Maps API loaded")}>
        <Map
          mapId={'e887d1c00d98dff2215d70b4'}
          defaultZoom={13}
          defaultCenter={selectedMarker}
          fullscreenControl={false}
          onClick={handleMapClick}
          onZoomChanged={(event) => {
            const zoom = event.map.zoom;
            updateSelectedPlace({ lat: selectedMarker.lat, lng: selectedMarker.lng, zoom });
          }}
          onCenterChanged={(event) => {
            const center = event.map.getCenter();
            updateSelectedPlace({ lat: center.lat(), lng: center.lng(), zoom: event.map.zoom });
          }}
          style={{height: "450px"}}
        >
          <AdvancedMarker position={selectedMarker} />
          {places && places.map((place) => (<div key={place.id}>
            {selectedInfoWindow && selectedInfoWindow.id === place.id && (
              <InfoWindow
                position={{ lat: place.location.latitude, lng: place.location.longitude }}
                onCloseClick={() => setSelectedInfoWindow(null)}
              >
                <div className="m-0">
                  <h5>{place.displayName.text}</h5>
                  <a href={place.googleMapsUri} target="_blank" rel="noopener noreferrer">
                    View on Google Maps
                  </a>
                </div>
              </InfoWindow>
            )}
            <AdvancedMarker
              position={{ lat: place.location.latitude, lng: place.location.longitude }}
              onClick={() => {
                console.log("Marker clicked:", place);
                setSelectedInfoWindow(place);
                updateSelectedPlace({
                  lat: place.location.latitude,
                  lng: place.location.longitude,
                  zoom: 15 // default zoom level for selected marker
                });
              }}
            >
              <FontAwesomeIcon icon={faArrowDown} style={{fontSize: selectedBusiness === place.id ? '3rem' : '1.5rem'}} className={`text-${selectedBusiness === place.id ? 'primary' : 'secondary'}`} />
            </AdvancedMarker>
          </div>))}
        </Map>
      </APIProvider>
    </div>
  </>)
}

export default MapContainer