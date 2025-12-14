import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

/* global Office */

const title = "Valuation Platform Add-in";

const render = (Component: typeof App) => {
    const rootElement = document.getElementById("container");
    if (!rootElement) throw new Error("Root element not found");
    const root = createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <Component />
        </React.StrictMode>
    );
};

// Ensure Office initializes before rendering
Office.onReady(() => {
    render(App);
});
