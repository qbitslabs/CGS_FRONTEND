/* Root clinic-dashboard app: auth + toast providers around staff routes.
 * Restores the last in-session path so a refresh stays on the same page. */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { AppRoutes } from './routes';

export const App: React.FC = () => {
  const initialRoute = sessionStorage.getItem('cgs_active_route') || '/';

  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

export default App;
