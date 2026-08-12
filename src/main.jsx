import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToolsProvider } from './context/ToolsContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <ToolsProvider>
          <App />
        </ToolsProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>,
)
