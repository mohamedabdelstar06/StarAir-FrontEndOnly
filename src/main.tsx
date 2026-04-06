import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSyncListener } from './lib/syncQueue'

import { registerSW } from 'virtual:pwa-register'
// Register offline → online sync trigger
registerSyncListener()

// Register service worker
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
