import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/fonts.css';
import './ui/tokens.css';
import './ui/app.css';

const root = document.getElementById('root');
if (!root) throw new Error('Braillix could not find its mount point (#root).');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
