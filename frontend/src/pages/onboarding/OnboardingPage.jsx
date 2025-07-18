import React, { useContext, useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth.js';
import { IntakeFormContext } from '../../context/IntakeFormContext';
import IntakeFormSection from '../../components/IntakeFormSection';
import { useStepValidation } from '../../hooks/useStepValidation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import API from '../../api';
import { useNavigate } from 'react-router-dom';

const formSteps = [
  {
    section: 'businessIdentity',
    title: 'Your Business Identity',
    description: 'Define what your business is and what it stands for.',
    inputs: [
      { name: 'name', label: 'Business Name', type: 'text', placeholder: 'E.g., Acme Corp' },
      { name: 'industry', label: 'Industry/Niche', type: 'text', placeholder: 'E.g., Technology, Healthcare' },
      { name: 'mission', label: 'What is your mission?', type: 'text', placeholder: 'E.g., To provide affordable tech solutions' },
      { name: 'valueProp', label: 'What’s your unique value proposition?', type: 'text', placeholder: 'E.g., Fastest delivery in the market' }
    ]
  },
  {
    section: 'idealCustomer',
    title: 'Ideal Customer Description',
    description: 'Describe your dream client in as much detail as possible.',
    inputs: [
      { name: 'jobTitle', label: 'Job Title / Role', type: 'text', placeholder: 'E.g., Marketing Manager' },
      { name: 'industry', label: 'Industry they work in', type: 'text', placeholder: 'E.g., Retail, Finance' },
      { name: 'companySize', label: 'Company size', type: 'text', placeholder: 'E.g., 50-200 employees' },
      { name: 'budgetLevel', label: 'Typical budget for your service', type: 'text', placeholder: 'E.g., $10,000 - $50,000' }
    ]
  },
  {
    section: 'psychographics',
    title: 'Customer Mindset & Motivation',
    description: 'What your ideal customer thinks, feels, and needs.',
    inputs: [
      { name: 'painPoints', label: 'Main pain points', type: 'text', placeholder: 'E.g., Lack of time, high costs' },
      { name: 'goals', label: 'What goals are they trying to achieve?', type: 'text', placeholder: 'E.g., Increase efficiency, save money' },
      { name: 'decisionDrivers', label: 'What influences their buying decisions?', type: 'text', placeholder: 'E.g., Price, quality, brand reputation' }
    ]
  },
  {
    section: 'customerBehavior',
    title: 'Behavior & Discovery Channels',
    description: 'Where and how your customer finds solutions like yours.',
    inputs: [
      { name: 'platforms', label: 'Which platforms are they active on?', type: 'text', placeholder: 'E.g., LinkedIn, Instagram' },
      { name: 'searchQueries', label: 'What would they Google to find you?', type: 'text', placeholder: 'E.g., Best CRM for small businesses' },
      { name: 'buyingProcess', label: 'What’s their typical buying process?', type: 'text', placeholder: 'E.g., Research, compare, purchase' }
    ]
  }
];

function OnboardingPage() {
  const { user, loading } = useAuth();

  const navigate = useNavigate();
  const { state, dispatch } = useContext(IntakeFormContext);
  const { step } = state;

  const [ savingStep, setSavingStep ] = useState(1);
  const [ savingStepMessage, setSavingStepMessage ] = useState('');
  const [ submitLoading, setSubmitLoading ] = useState(false);
  const [ icpDropdownOpen, setIcpDropdownOpen ] = useState(false);
  const [ icpSummaries, setIcpSummaries ] = useState({
    buyingTriggers: false,
    coldMessageTips: false,
    companyType: false,
    painPoints: false,
    preferredChannels: false,
  });

  const { isStepValid } = useStepValidation();
  const current = formSteps[step - 1];

  useEffect(() => {
    if (!loading && user) {
      dispatch({ type: 'SET_FORM_DATA', payload: user.profile?.profileData || {} });
    }
  }, [loading, user]);

  const handleNext = () => dispatch({ type: 'NEXT_STEP' });
  const handlePrev = () => dispatch({ type: 'PREV_STEP' });

  const handleSubmit = async (e) => {
    if (submitLoading) return;
    e.preventDefault();
    console.log('Form submitted:', state.data); 

    setSubmitLoading(true);
    setSavingStep(1);
    setSavingStepMessage('Saving your answers...');

    try {
      await API.post('/onboarding/q', state.data);
      setSavingStepMessage('Generating your Ideal Customer Profile...');
      setSavingStep(2);

      await API.post('/onboarding/icp');

      setSavingStepMessage('Done! Redirecting...');
      setTimeout(() => {
        dispatch({ type: 'RESET_FORM' });
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error(err);
      setSavingStepMessage('Something went wrong. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (<>
    <div className="p-3 d-flex flex-column align-items-center">
      {!loading && user && user.profile && user.profile.icpSummary && <>
        <div className={`container m-0 align-self-center ${!icpDropdownOpen && 'mb-4'}`}>
          <button className='btn btn-subtle-outline-secondary' onClick={() => setIcpDropdownOpen(!icpDropdownOpen)}>
            <span>Existing ICP</span>
            <FontAwesomeIcon icon={icpDropdownOpen ? faChevronUp : faChevronDown} className='ms-2'/>
          </button>
        </div>
        {icpDropdownOpen && 
          <div className='container m-0 mb-4 ps-4 align-self-center d-flex flex-column align-items-start'>
            <button className='mb-2 btn' onClick={() => setIcpSummaries({ ...icpSummaries, buyingTriggers: !icpSummaries.buyingTriggers })}>
              Customer's buying triggers <FontAwesomeIcon icon={icpSummaries.buyingTriggers ? faChevronUp : faChevronDown}/>
            </button>
            {icpSummaries.buyingTriggers && user.profile.icpSummary.buyingTriggers && user.profile.icpSummary.buyingTriggers.map((trigger, index) => (
              <div key={index} className='mb-2'>
                <span className='badge bg-secondary me-2'>{index + 1}</span>
                <span>{trigger}</span>
              </div>
            ))}

            <button className='mb-2 btn' onClick={() => setIcpSummaries({ ...icpSummaries, coldMessageTips: !icpSummaries.coldMessageTips })}>
              Tips for cold outreach <FontAwesomeIcon icon={icpSummaries.coldMessageTips ? faChevronUp : faChevronDown}/>
            </button>
            {icpSummaries.coldMessageTips && user.profile.icpSummary.coldMessageTips && user.profile.icpSummary.coldMessageTips.map((tip, index) => (
              <div key={index} className='mb-2'>
                <span className='badge bg-secondary me-2'>{index + 1}</span>
                <span>{tip}</span>  
              </div>
            ))}

            <button className='mb-2 btn' onClick={() => setIcpSummaries({ ...icpSummaries, companyType: !icpSummaries.companyType })}>
              Company type <FontAwesomeIcon icon={icpSummaries.companyType ? faChevronUp : faChevronDown}/>
            </button>
            {icpSummaries.companyType && user.profile.icpSummary.companyType &&
              <div className='mb-2'>
                <span className='badge bg-secondary me-2'>1</span>
                <span>{user.profile.icpSummary.companyType}</span>
              </div>
            }

            <button className='mb-2 btn' onClick={() => setIcpSummaries({ ...icpSummaries, painPoints: !icpSummaries.painPoints })}>
              Customer's pain points <FontAwesomeIcon icon={icpSummaries.painPoints ? faChevronUp : faChevronDown}/>
            </button>
            {icpSummaries.painPoints && user.profile.icpSummary.painPoints && user.profile.icpSummary.painPoints.map((point, index) => (
              <div key={index} className='mb-2'>
                <span className='badge bg-secondary me-2'>{index + 1}</span>
                <span>{point}</span>
              </div>
            ))}

            <button className='mb-2 btn' onClick={() => setIcpSummaries({ ...icpSummaries, preferredChannels: !icpSummaries.preferredChannels })}>
              Customer's preferred channels <FontAwesomeIcon icon={icpSummaries.preferredChannels ? faChevronUp : faChevronDown}/>
            </button>
            {icpSummaries.preferredChannels && user.profile.icpSummary.preferredChannels && user.profile.icpSummary.preferredChannels.map((channel, index) => (
              <div key={index} className='mb-2'>
                <span className='badge bg-secondary me-2'>{index + 1}</span>
                <span>{channel}</span>  
              </div>
            ))}
          </div>
        }
      </>}

      <div className="container position-relative">
        <div className="col-8">
          <IntakeFormSection
            title={current.title}
            description={current.description}
            section={current.section}
            inputs={current.inputs}
          />
          <div className="d-flex align-items-center mt-4 gap-2">
            {step > 1 && (
              <button className="btn btn-accent rounded-4"
              onClick={handlePrev}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            )}

            {step < formSteps.length ? (
              <button
                className="btn btn-accent rounded-4"
                onClick={handleNext}
                disabled={!isStepValid}
              >
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            ) : (
              <button
                className="btn btn-success rounded-4"
                disabled={!isStepValid}
                type="submit"
                onClick={(e) => handleSubmit(e)}
              >
                Submit
              </button>
            )}

            {submitLoading && (
              <div className="text-center w-100 mt-4">
                <div className="spinner-border mb-2" role="status" />
                <p className="text-muted">{savingStepMessage}</p>
              </div>
            )}
          </div>
          

          <div className="step-indicator position-absolute top-0 end-0 p-3 d-flex ">
            {formSteps.map((_, index) => (
              <div
                key={index}
                className={`step-indicator-dot ${index < step - 1 ? 'completed' : ''} ${index === step - 1 ? 'current' : ''}`}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: index < step - 1 ? '#28a745' : index === step - 1 ? '#ffc107' : '#6c757d',
                  margin: '0 5px',
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>);
}

export default OnboardingPage;