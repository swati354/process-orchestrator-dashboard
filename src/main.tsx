import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { getAppBase } from '@uipath/uipath-typescript';
import { App } from '@/App';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={getAppBase()}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
