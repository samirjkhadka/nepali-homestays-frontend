import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { CurrencyProvider } from '@/lib/currency';
import { I18nProvider } from '@/lib/i18n';
import { reportError, flushJourneyOnUnload } from '@/lib/logging';
import App from './App';
import './index.css';

// Global error reporting to backend
window.onerror = (message, source, lineno, colno, error) => {
  reportError(
    typeof message === 'string' ? message : String(message),
    { stack: error?.stack ?? `${source}:${lineno}:${colno}` }
  );
};
window.onunhandledrejection = (event) => {
  const msg = event.reason?.message ?? event.reason ?? 'Unhandled rejection';
  reportError(String(msg), { stack: event.reason?.stack });
};
window.addEventListener('beforeunload', flushJourneyOnUnload);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <I18nProvider>
            <App />
          </I18nProvider>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
