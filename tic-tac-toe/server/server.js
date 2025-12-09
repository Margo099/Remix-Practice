// Автозагрузка . env
try {
  require('dotenv').config()
} catch (e) {
  console.warn('dotenv not found, using system env vars')
}

console.log('🐛 DEBUG TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ?  
  `${process.env.TELEGRAM_BOT_TOKEN. slice(0, 10)}... (length: ${process.env. TELEGRAM_BOT_TOKEN. length})` : 
  '❌ UNDEFINED')
console.log('🐛 DEBUG TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID)

const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const cors = require('cors')
const fs = require('fs')
const crypto = require('crypto')
const redis = require('redis')
const TelegramBot = require('node-telegram-bot-api')

const app = express()
const PORT = process.env.PORT || 3000

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''
const API_SECRET = process.env.API_SECRET || ''
const TOKEN_TTL_SEC = parseInt(process. env.TOKEN_TTL_MS || '300000', 10) / 1000
const REDIS_URL = process.env. REDIS_URL || 'redis://localhost:6379'

app. use(bodyParser.json())
app.use(cors())

// Раздача статических файлов
const clientDist = path.join(__dirname, 'dist')
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
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
      console. log(`🔄 Redis retry ${retries}/10... `)
      return retries * 500
    }
  }
})

redisClient.on('error', err => console.error('❌ Redis error:', err. message))
redisClient.on('connect', () => console.log('🔄 Redis connecting... '))
redisClient.on('ready', () => console.log('✅ Redis ready'))

async function connectRedis() {
  try {
    await redisClient.connect()
  } catch (err) {
    console.error('❌ Redis connection failed:', err.message)
    console.warn('⚠️ Server will start but tokens will NOT work')
  }
}
connectRedis()

// Telegram Bot
let bot = null
const userChatIds = new Map() // Хранилище userId -> chatId

if (TELEGRAM_BOT_TOKEN) {
  try {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })
    
    // Обработчик команды /start
    bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id
      const userId = msg.from.id
      const username = msg.from.username || msg.from.first_name
      
      // Сохраняем связь userId -> chatId
      userChatIds.set(userId, chatId)
      console.log(`👤 User registered: ${username} (ID: ${userId})`)
      
      // Генерируем токен
      const token = generateToken()
      
      try {
        if (redisClient.isOpen) {
          await redisClient. setEx(`token:${token}`, TOKEN_TTL_SEC, Date.now().toString())
          console.log(`✅ Token issued for ${username}: ${token}`)
        }
      } catch (err) {
        console.error('❌ Token generation error:', err.message)
      }
      
      // Отправляем сообщение с inline-кнопкой
      bot.sendMessage(chatId, 
        `🎮 Привет, ${username}!\n\n` +
        `Твой токен для игры: \`${token}\`\n\n` +
        `Токен действителен ${Math.round(TOKEN_TTL_SEC / 60)} минут.\n\n` +
        `Нажми кнопку ниже, чтобы начать игру! `,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🎮 Играть',
                web_app: { url: 'https://tic-tac-toe7.ru' }
              }
            ]]
          }
        }
      )
    })
    
    bot.on('polling_error', (error) => {
      console. error('❌ Telegram polling error:', error. message)
    })
    
    console.log('✅ Telegram Bot initialized')
  } catch (err) {
    console.error('❌ Telegram Bot init error:', err.message)
  }
}

function generateToken() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return crypto.randomBytes(16).toString('hex')
}

// API:  Выдача токена (HTTP)
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

// API: Валидация токена
app.post('/api/validate-token', async (req, res) => {
  try {
    const { token } = req.body
    
    if (!token) {
      return res.status(400).json({ valid: false, error: 'Token required' })
    }
    
    if (!redisClient.isOpen) {
      return res.status(503).json({ valid: false, error: 'Redis not connected' })
    }

    const exists = await redisClient.exists(`token:${token}`)
    console.log(`🔍 Token validation: ${token} - ${exists ? 'VALID' : 'INVALID'}`)
    
    res.json({ valid: exists === 1 })
  } catch (err) {
    console.error('❌ Token validation error:', err. message)
    res.status(500).json({ valid: false, error: 'Server error' })
  }
})

// API: Уведомление о победе
app.post('/api/notify-winner', async (req, res) => {
  try {
    const { winner, telegramUserId, telegramUsername, token } = req.body
    
    console.log(`🎉 Winner notification: ${winner} (User: ${telegramUsername}, ID: ${telegramUserId})`)
    
    if (!bot) {
      console.warn('⚠️ Telegram bot not initialized')
      return res.json({ success: true, note: 'Bot not configured' })
    }
    
    // Получаем chatId пользователя
    const chatId = userChatIds.get(telegramUserId) || TELEGRAM_CHAT_ID
    
    if (chatId) {
      try {
        await bot.sendMessage(chatId, 
          `🎉 Поздравляем, ${telegramUsername || 'игрок'}!\n\n` +
          `Символ "${winner}" победил в игре!\n\n` +
          `Хочешь сыграть ещё?  Получи новый токен командой /start`,
          {
            reply_markup: {
              inline_keyboard: [[
                {
                  text: '🔄 Новая игра',
                  callback_data: 'new_game'
                }
              ]]
            }
          }
        )
        console.log(`✅ Notification sent to ${telegramUsername}`)
      } catch (err) {
        console.error('❌ Telegram send error:', err.message)
      }
    } else {
      console.log(`⚠️ Chat ID not found for user ${telegramUserId}`)
    }
    
    // Удаляем использованный токен
    if (token && redisClient.isOpen) {
      await redisClient.del(`token:${token}`)
      console.log(`🔐 Token consumed: ${token}`)
    }
    
    res.json({ success: true })
  } catch (err) {
    console.error('❌ Notify winner error:', err.message)
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// Обработчик callback-кнопок
if (bot) {
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id
    const userId = query.from.id
    const username = query.from.username || query.from.first_name
    
    if (query.data === 'new_game') {
      // Генерируем новый токен
      const token = generateToken()
      
      try {
        if (redisClient.isOpen) {
          await redisClient. setEx(`token:${token}`, TOKEN_TTL_SEC, Date.now().toString())
        }
      } catch (err) {
        console.error('❌ Token generation error:', err. message)
      }
      
      bot.answerCallbackQuery(query.id, { text: 'Токен создан!' })
      
      bot.sendMessage(chatId, 
        `🎮 Новая игра!\n\n` +
        `Твой токен:  \`${token}\`\n\n` +
        `Токен действителен ${Math. round(TOKEN_TTL_SEC / 60)} минут.`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              {
                text: '🎮 Играть',
                web_app: { url: 'https://tic-tac-toe7.ru' }
              }
            ]]
          }
        }
      )
    }
  })
}

// POST /api/result (старый эндпоинт, оставляем для совместимости)
app.post('/api/result', async (req, res) => {
  try {
    const providedToken = req.header('x-api-key') || ''

    if (API_SECRET && providedToken === API_SECRET) {
      console.log('🔑 Admin key used')
    } else {
      if (!redisClient.isOpen) {
        return res.status(503).json({ error: 'Redis not connected' })
      }

      const exists = await redisClient.exists(`token:${providedToken}`)
      if (!exists) {
        console.warn('❌ Invalid token:', providedToken)
        return res. status(401).json({ error: 'Invalid or missing token' })
      }

      await redisClient.del(`token:${providedToken}`)
      console.log(`🔐 Token consumed: ${providedToken}`)
    }

    const { result, code } = req.body || {}
    let text = ''
    if (result === 'win') {
      text = `🎉 Победа!  Промокод выдан: ${code || ''}`
    } else if (result === 'lose') {
      text = '😔 Проигрыш'
    } else if (result === 'draw') {
      text = '🤝 Ничья'
    } else {
      text = `Результат: ${result}`
    }

    if (bot && TELEGRAM_CHAT_ID) {
      try {
        await bot.sendMessage(TELEGRAM_CHAT_ID, text)
        console.log('✅ Result sent to Telegram')
      } catch (err) {
        console.error('❌ Telegram send error:', err.message)
      }
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('❌ /api/result error:', err.message)
    res.status(500).json({ error: 'server error', details: err.message })
  }
})

// Диагностика
if (API_SECRET) {
  app.get('/api/_tokens', async (req, res) => {
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
        tokens.push({ token: k. replace('token:', ''), ttl })
      }
      res.json({ tokens, count: tokens.length, users: Array.from(userChatIds. keys()) })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })
}

// SPA fallback
if (fs.existsSync(clientDist)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index. html'))
  })
}

app.listen(PORT, () => {
  console.log(`🚀 Server:  http://localhost:${PORT}`)
  console.log(`⏱️ Token TTL: ${TOKEN_TTL_SEC}s (${Math.round(TOKEN_TTL_SEC / 60)} min)`)
  console.log(`🔗 Redis: ${REDIS_URL. replace(/:[^@]+@/, ': ***@')}`)
  if (! TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ Telegram bot not configured')
  } else {
    console.log('✅ Telegram bot configured')
  }
})

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...')
  if (bot) {
    bot.stopPolling()
    console.log('✅ Telegram bot stopped')
  }
  if (redisClient.isOpen) {
    await redisClient.quit()
    console.log('✅ Redis disconnected')
  }
  process.exit(0)
})