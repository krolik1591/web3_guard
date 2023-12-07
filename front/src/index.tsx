import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {WebAppProvider} from "@vkruglikov/react-telegram-web-app";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <WebAppProvider options={{smoothButtonsTransition: true}}>
      <App/>
    </WebAppProvider>
  </React.StrictMode>
);
