// Автозагрузка . env
try {
  require('dotenv'). config()
} catch (e) {
  console.warn('dotenv not found, using system env vars')
}
console.log('🐛 DEBUG TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ?  
  `${process.env.TELEGRAM_BOT_TOKEN. slice(0, 10)}...  (length: ${process.env.TELEGRAM_BOT_TOKEN.length})` : 
  '❌ UNDEFINED')
console.log('🐛 DEBUG TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID)

const express = require('express')
const fetch = require('node-fetch')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const fs = require('fs')
const crypto = require('crypto')
const redis = require('redis')

const app = express()
const PORT = process.env.PORT || 3000

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''
const API_SECRET = process.env.API_SECRET || ''
const TOKEN_TTL_SEC = parseInt(process.env.TOKEN_TTL_MS || '300000', 10) / 1000
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

app.use(bodyParser.json())
app.use(cors())

// Раздача статических файлов
const clientDist = path.join(__dirname, 'dist')
if (fs.existsSync(clientDist)) {
  app. use(express.static(clientDist))
}

// Redis client с поддержкой TLS
const redisClient = redis.createClient({ 
  url: REDIS_URL,
  socket: {
    tls: REDIS_URL.startsWith('rediss://'),
    rejectUnauthorized: false,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis: max retries reached')
        return new Error('Redis connection failed')
      }
      console.log(`🔄 Redis retry ${retries}/10... `)
      return retries * 500
    }
  }
})

redisClient.on('error', err => console.error('❌ Redis error:', err. message))
redisClient.on('connect', () => console.log('🔄 Redis connecting...'))
redisClient.on('ready', () => console.log('✅ Redis ready'))

async function connectRedis() {
  try {
    await redisClient.connect()
  } catch (err) {
    console.error('❌ Redis connection failed:', err.message)
    console.warn('⚠️  Server will start but tokens will NOT work')
  }
}
connectRedis()

function generateToken() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return crypto.randomBytes(16).toString('hex')
}

app.get('/api/token', async (req, res) => {
  try {
    if (!redisClient.isOpen) {
      return res.status(503).json({ error: 'Redis not connected' })
    }

    const token = generateToken()
    await redisClient.setEx(`token:${token}`, TOKEN_TTL_SEC, Date.now().toString())
    console.log(`✅ Token issued: ${token}`)
    res.json({ token, expiresIn: TOKEN_TTL_SEC })
  } catch (err) {
    console.error('❌ Token error:', err.message)
    res.status(500).json({ error: 'cannot issue token' })
  }
})

// POST /api/result
app.post('/api/result', async (req, res) => {
  try {
    const providedToken = req.header('x-api-key') || ''

    if (API_SECRET && providedToken === API_SECRET) {
      console.log('🔑 Admin key used')
    } else {
      if (!redisClient. isOpen) {
        return res.status(503).json({ error: 'Redis not connected' })
      }

      const exists = await redisClient.exists(`token:${providedToken}`)
      if (!exists) {
        console.warn('❌ Invalid token:', providedToken)
        return res. status(401).json({ error: 'Invalid or missing token' })
      }

      await redisClient.del(`token:${providedToken}`)
      console. log(`🔐 Token consumed: ${providedToken}`)
    }

    const { result, code } = req.body || {}
    let text = ''
    if (result === 'win') {
      text = `Победа!  Промокод выдан: ${code || ''}`
    } else if (result === 'lose') {
      text = 'Проигрыш'
    } else if (result === 'draw') {
      text = 'Ничья'
    } else {
      text = `Результат: ${result}`
    }

    //Проверка перед отправкой
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (! botToken || !chatId) {
      console.warn('⚠️ Telegram credentials missing in env')
      return res.json({ ok: true, note: 'telegram not configured' })
    }

    console.log('🐛 botToken:', botToken ?  `${botToken.slice(0,10)}... (${botToken.length})` : '❌ EMPTY')
    console. log('🐛 chatId:', chatId)

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    console.log('📤 Sending to Telegram:', text)
    console.log('🐛 URL:', telegramUrl.slice(0, 60) + '...')

    const telegramRes = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text
      })
    })

    if (!telegramRes.ok) {
      const errText = await telegramRes.text()
      console.error('❌ Telegram API error:', telegramRes.status, errText)
      return res. status(500).json({ 
        error: 'Telegram error', 
        details: `${telegramRes.status}: ${errText}` 
      })
    }

    const data = await telegramRes.json()
    console.log('✅ Telegram sent:', data)

    res.json({ ok: true })
  } catch (err) {
    console.error('❌ /api/result error:', err.message)
    console. error('Stack:', err.stack)
    res.status(500).json({ error: 'server error', details: err.message })
  }
})

//Диагностика
if (API_SECRET) {
  app. get('/api/_tokens', async (req, res) => {
    try {
      const key = req.header('x-api-key') || ''
      if (key !== API_SECRET) return res.status(401).json({ error: 'Unauthorized' })
      
      if (!redisClient.isOpen) {
        return res.status(503).json({ error: 'Redis not connected' })
      }

      const keys = await redisClient.keys('token:*')
      const tokens = []
      for (const k of keys) {
        const ttl = await redisClient.ttl(k)
        tokens. push({ token: k. replace('token:', ''), ttl })
      }
      res. json({ tokens, count: tokens. length })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })
}

//SPA fallback
if (fs.existsSync(clientDist)) {
  app. get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`🚀 Server: http://localhost:${PORT}`)
  console.log(`⏱️  Token TTL: ${TOKEN_TTL_SEC}s`)
  console.log(`🔗 Redis: ${REDIS_URL. replace(/:[^@]+@/, ':***@')}`) // скрываем пароль в логе
  if (! TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('⚠️  Telegram not configured')
  } else {
    console.log('✅ Telegram configured')
  }
})

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...')
  if (redisClient.isOpen) {
    await redisClient.quit()
    console.log('✅ Redis disconnected')
  }
  process.exit(0)
})