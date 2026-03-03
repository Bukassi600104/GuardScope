import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import '../../tailwind.css'

const root = document.getElementById('sidebar-root')
if (root) {
  createRoot(root).render(<App />)
}
