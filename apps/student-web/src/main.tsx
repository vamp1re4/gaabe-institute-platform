import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { I18nProvider } from '@gaabe/i18n';
import { ErrorBoundary, MotionProvider } from '@gaabe/ui';
import '@gaabe/ui/styles.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <ErrorBoundary>
        <MotionProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MotionProvider>
      </ErrorBoundary>
    </I18nProvider>
  </StrictMode>,
);
