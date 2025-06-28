/** @jsxImportSource @emotion/react */
import { createRoot } from 'react-dom/client'
import App from './App'

// Simple React setup for our blockchain-based game
// We don't need the full Game Park framework since we're using our own blockchain implementation
const container = document.getElementById('root')!
const root = createRoot(container)

root.render(<App />)
