import React, { createContext, useReducer, useContext } from 'react';

// STEP-BY-STEP FORM STRUCTURE
const initialState = {
  step: 1,
  data: {
    businessIdentity: {
      name: '',
      industry: '',
      mission: '',
      valueProp: ''
    },
    idealCustomer: {
      jobTitle: '',
      industry: '',
      companySize: '',
      budgetLevel: ''
    },
    psychographics: {
      painPoints: '',
      goals: '',
      decisionDrivers: ''
    },
    customerBehavior: {
      platforms: '',
      searchQueries: '',
      buyingProcess: ''
    }
  }
};

// ACTION TYPES
const reducer = (state, action) => {
  switch (action.type) {
    case 'NEXT_STEP':
      return { ...state, step: state.step + 1 };
    case 'PREV_STEP':
      return { ...state, step: state.step - 1 };
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'UPDATE_FIELD':
      const { section, field, value } = action.payload;
      return {
        ...state,
        data: {
          ...state.data,
          [section]: {
            ...state.data[section],
            [field]: value,
          }
        }
      };
    case 'RESET_FORM': // Reset form action
      return initialState;
    case 'SET_FORM_DATA':
      return {
        ...state,
        data: action.payload
      };
    default:
      return state;
  }
};

export const IntakeFormContext = createContext();

export const IntakeFormProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <IntakeFormContext.Provider value={{ state, dispatch }}>
      {children}
    </IntakeFormContext.Provider>
  );
};

export const useIntakeForm = () => useContext(IntakeFormContext);