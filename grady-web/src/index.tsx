import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './config/authConfig';

// MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Add type declaration for window
declare global {
  interface Window {
    msalInstance: PublicClientApplication;
  }
}

// Add to window for App.tsx
window.msalInstance = msalInstance;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </React.StrictMode>
);
