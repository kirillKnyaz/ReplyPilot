import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import Layout from './Layout';
import ProtectedRoute from './ProtectedRoute';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import { IntakeFormContext, IntakeFormProvider } from './context/IntakeFormContext';
import PricingPage from './pages/billing/PricingPage';
import PaymentSuccessful from './pages/billing/PaymentSuccessful';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path='/pricing' element={<PricingPage />} />
            <Route path="/billing/success" element={<ProtectedRoute><PaymentSuccessful /></ProtectedRoute>} />
            
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <IntakeFormProvider>
                    <OnboardingPage />
                  </IntakeFormProvider>
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}