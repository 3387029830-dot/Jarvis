import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './design-system/tokens.css';
import './design-system/components.css';
import './shell/app-shell.css';
import './presence/presence.css';
import './voice/voice.css';
import './conversation/conversation.css';
import './showcase/showcase.css';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Renderer root element is missing.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
