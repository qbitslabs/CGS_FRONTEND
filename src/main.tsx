/* Boots the clinic staff React app into #root and loads global styles.
 * Wraps the tree in StrictMode; session route is restored inside App. */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
