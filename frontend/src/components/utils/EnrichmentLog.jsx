import React from 'react'
import API from '../../api';
import { useEffect } from 'react';

function EnrichmentLog({ leadId, goal }) {
  const [latestLog, setLatestLog] = React.useState(null);
  const [logError, setLogError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [dots, setDots] = React.useState('.');

  const getLatestLog = async (leadId, goal) => {
    if (latestLog === null) setLoading(true);
    API.get(`/leads/${leadId}/enrichmentLog/${goal}`).then((response) => {
      console.log('Latest log response:', response.data);
      setLatestLog(response.data);
    }).catch((error) => {
      setLogError(error);
    }).finally(() => {
      setLoading(false);
    });
  }

  // fetch every 1500ms, stop after 5 attempts for debug
  useEffect(() => {
    // let attempts = 0;
    const interval = setInterval(() => {
      getLatestLog(leadId, goal);
      // attempts += 1;
      // if (attempts >= 5) {
      //   clearInterval(interval);
      //   setLoading(false);
      // }
    }, 1500);

    return () => clearInterval(interval);
  }, [leadId, goal]);

  function formatMessage(latestLog) {
    const stepMap = {
      'GET_LEAD': 'Getting lead data',
      'GET_SOURCE': 'Looking for sources',
      'SCRAPE_SOURCE': 'Scraping data',
      'EVALUATE_GPT': 'Evaluating data'
    }

    const statusMap = {
      'STARTED': 'started',
      'SUCCESS': 'successful',
      'ERROR': 'failed'
    }

    return `${stepMap[latestLog.step] || ''} ${statusMap[latestLog.status] || ''}`.trim();
  }

  useEffect(() => {
    if (loading) {
      const dotsInterval = setInterval(() => {
        setDots((prev) => (prev === '...' ? '.' : prev + '.'));
      }, 300);

      return () => clearInterval(dotsInterval);
    }
  }, [loading]);

  return (
    <span>
      {loading && latestLog !== null 
        ? <span>{dots}</span> 
        : latestLog 
          ? formatMessage(latestLog)
          : 'No logs available'
      }
    </span>
  );
}

export default EnrichmentLog