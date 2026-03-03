import React from 'react'
import { createRoot } from 'react-dom/client'
import Popup from './Popup'
import '../../tailwind.css'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(<Popup />)
}
