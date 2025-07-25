import { useState } from 'react';

function EmailTagInput({ emailTo, setEmailTo }) {
  const [inputValue, setInputValue] = useState('');

  const addEmail = (email) => {
    const trimmed = email.trim();
    if (trimmed && !emailTo.includes(trimmed)) {
      setEmailTo([...emailTo, trimmed]);
    }
  };

  const handleKeyDown = (e) => {
    if (['Enter', ','].includes(e.key)) {
      e.preventDefault();
      addEmail(inputValue);
      setInputValue('');
    }
  };

  const removeEmail = (email) => {
    setEmailTo(emailTo.filter(e => e !== email));
  };

  return (
    <div className="form-control d-flex flex-wrap align-items-center" style={{ minHeight: '48px', gap: '0.5rem' }}>
      {emailTo.map((email, idx) => (
        <span key={idx} className="badge bg-secondary d-flex align-items-center">
          {email}
          <button
            type="button"
            className="btn-close btn-close-white btn-sm ms-2"
            onClick={() => removeEmail(email)}
            aria-label="Remove"
          />
        </span>
      ))}
      <input
        type="text"
        placeholder="Enter email"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="border-0 flex-grow-1"
        style={{ outline: 'none', minWidth: '120px' }}
      />
    </div>
  );
}

export default EmailTagInput;