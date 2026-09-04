import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
import App from './App'
import { i18nInitPromise } from './i18n'
import './index.css'

const container = document.getElementById('root')
if (container) {
  i18nInitPromise.then(() => {
    createRoot(container).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
}
