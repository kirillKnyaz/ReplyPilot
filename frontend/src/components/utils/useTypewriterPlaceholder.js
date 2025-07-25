import { useEffect, useState } from 'react';

export default function useTypewriterPlaceholder(phrases, delay = 80, pause = 2000) {
  const [displayed, setDisplayed] = useState('');
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[currentPhrase];
    let timer;

    if (deleting) {
      timer = setTimeout(() => {
        setDisplayed(prev => prev.slice(0, -1));
        if (displayed.length === 0) {
          setDeleting(false);
          setCurrentPhrase((currentPhrase + 1) % phrases.length);
        }
      }, delay / 2);
    } else {
      timer = setTimeout(() => {
        setDisplayed(phrase.slice(0, displayed.length + 1));
        if (displayed === phrase) {
          setTimeout(() => setDeleting(true), pause);
        }
      }, delay);
    }

    return () => clearTimeout(timer);
  }, [displayed, deleting, currentPhrase]);

  return displayed;
}