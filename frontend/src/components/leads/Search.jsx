import axios from 'axios'
import React, { useState } from 'react'

function Search({customSearchResults, setCustomSearchResults, setPlaces, selectedBusiness, scrape }) {
  const handleScrapeResult = async (link) => {
    console.log("Setting place website uri:", selectedBusiness, link);
    
    await setPlaces((prevPlaces) => {
      return prevPlaces.map((place) => {
        if (place.id === selectedBusiness.id) {
          return { ...place, websiteUri: link };
        }
        return place;
      });
    });

    scrape(link, selectedBusiness, "fb");
  }

  return customSearchResults && customSearchResults.length > 0 && (
    <div className="container-fluid mt-4 border-top pt-4">
      <h2 className="text-white mb-4">Search Results</h2>
      <div className="row g-3">
        {customSearchResults.map((result, idx) => (
          <div key={idx} className="col-12">
            <div className="card bg-dark text-white border-light">
              <div className="row g-0">
                {result.pagemap?.cse_thumbnail && (
                  <div className="col-md-2">
                    <img src={result.pagemap.cse_thumbnail[0].src} alt="thumb" className="img-fluid rounded-start"/>
                  </div>
                )}
                <div className={`col ${result.pagemap?.cse_thumbnail ? 'md-10' : 'md-12'}`}>
                  <div className="card-body">
                    <div className='d-flex justify-content-between align-items-center'>
                      <h5 className="card-title mb-1">
                        <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none">
                          {result.title}
                        </a>
                      </h5>

                      <button className='btn btn-outline-primary' onClick={() => handleScrapeResult(result.link)}>
                        Analyse Page
                      </button>
                    </div>
                    <p className="card-text"><small className="text-secondary">{result.displayLink}</small></p>
                    <p className="card-text">{result.snippet}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Search