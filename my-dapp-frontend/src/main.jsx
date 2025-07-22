import React from 'react'
import ReactDOM from 'react-dom/client'
import DonationApp from './DonationApp.jsx' // Изменили импорт на ваш новый файл
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DonationApp /> {/* Рендерим ваш новый компонент */}
  </React.StrictMode>,
)
