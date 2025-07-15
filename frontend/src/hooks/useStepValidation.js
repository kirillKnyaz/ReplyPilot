import { useContext } from 'react';
import { IntakeFormContext } from '../context/IntakeFormContext';

const requiredFields = {
  businessIdentity: ['name', 'industry', 'mission', 'valueProp'],
  idealCustomer: ['jobTitle', 'industry', 'companySize', 'budgetLevel'],
  psychographics: ['painPoints', 'goals', 'decisionDrivers'],
  customerBehavior: ['platforms', 'searchQueries', 'buyingProcess']
};

export const useStepValidation = () => {
  const { state } = useContext(IntakeFormContext);
  const { step, data } = state;

  const sectionKey = Object.keys(requiredFields)[step - 1];
  const fields = requiredFields[sectionKey];
  const sectionData = data[sectionKey] || {};

  const isStepValid = fields.every(field => {
    const value = sectionData[field];
    return typeof value === 'string' && value.trim().length > 0;
  });

  return { isStepValid };
};