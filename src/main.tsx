import { ErrorBoundary } from './components/ErrorBoundary';
// Suppress benign Vite WebSocket error in AI Studio environment
window.addEventListener('error', (e) => {
  if (e.message && (e.message.includes('WebSocket closed without opened') || e.message.includes('Script error'))) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
});
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.message && (e.reason.message.includes('WebSocket closed without opened') || e.reason.message.includes('Script error'))) {
    e.preventDefault();
    e.stopImmediatePropagation();
  } else if (e.reason === 'WebSocket closed without opened.' || e.reason === 'Script error.') {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
});

const originalOnError = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  if (typeof message === 'string' && (message.includes('Script error') || message.includes('WebSocket closed without opened'))) {
    return true; // suppresses the error
  }
  if (originalOnError) {
    return originalOnError(message, source, lineno, colno, error);
  }
  return false;
};

const originalError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && (args[0].includes('failed to connect to websocket') || args[0].includes('WebSocket closed without opened') || args[0].includes('Script error'))) {
    return;
  }
  originalError.apply(console, args);
};
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Clean up any stale service workers and cached resources that cause bundle load crashes on mobile devices
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister().then(success => {
        if (success) {
          console.log('Successfully unregistered stale service worker');
          window.location.reload();
        }
      });
    }
  });
}

if ('caches' in window) {
  caches.keys().then(names => {
    for (const name of names) {
      caches.delete(name);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
);
