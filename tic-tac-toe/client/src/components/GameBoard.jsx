import React, { useState, useEffect } from 'react'
import {
  Box, SimpleGrid, Text, Button, useDisclosure, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, VStack,
  HStack, Badge, useToast
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'

const PLAYER = 'X'
const AI = 'O'

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`

const WIN_MESSAGES = [
  'Ты невероятна!  🎉',
  'Потрясающе!  Ты победила!  ✨',
  'Браво!  Отличная игра!  🌟',
  'Ты мастер стратегии! 💎',
  'Фантастическая победа! 🏆'
]

const LOSE_MESSAGES = [
  'Не в этот раз 💫',
  'Почти получилось! 🌸',
  'Ещё чуть-чуть!   🌺',
  'В следующий раз точно! 🍀',
  'Не сдавайся!  💪'
]

const DRAW_MESSAGES = [
  'Ничья! 🤝',
  'Достойная партия! ⚖️',
  'Интересная игра! 🎭',
  'Боевая ничья! ⚡',
  'Отличная защита! 🛡️'
]

const LOSE_BODY_MESSAGES = [
  'Тебе осталось совсем чуть-чуть!   Давай попробуем снова?',
  'Ещё немного практики и победа твоя! Продолжим?',
  'Совсем близко!  Не сдавайся, попробуй ещё раз! ',
  'У тебя почти получилось!  Сыграем ещё? ',
  'Ты на правильном пути! Давай попробуем снова? '
]

const DRAW_BODY_MESSAGES = [
  'Почти получилось! Ещё один раунд?',
  'Была близка к победе! Попробуем ещё?',
  'Отличная партия! Сыграем снова?',
  'Чуть-чуть не хватило!  Давай ещё раз? ',
  'Неплохо!  Готова к реваншу? '
]

function getRandomMessage(messages) {
  return messages[Math.floor(Math.random() * messages.length)]
}

function generatePromo(){
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let s = ''
  for(let i=0;i<5;i++) s += chars[Math.floor(Math.random()*chars.length)]
  return s
}

function checkResult(b){
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ]
  for(const [a,c,d] of wins){
    if(b[a] && b[a] === b[c] && b[a] === b[d]){
      return { winner: b[a], line: [a,c,d] }
    }
  }
  if(b.every(Boolean)) return { winner:'draw' }
  return null
}

function bestMove(board){
  function minimax(bs, depth, isMax){
    const res = checkResult(bs)
    if(res){
      if(res.winner === AI) return 10 - depth
      if(res.winner === PLAYER) return depth - 10
      return 0
    }
    if(isMax){
      let best = -Infinity
      for(let i=0;i<9;i++){
        if(! bs[i]){
          bs[i] = AI
          const val = minimax(bs, depth+1, false)
          bs[i] = null
          best = Math.max(best, val)
        }
      }
      return best
    } else {
      let best = Infinity
      for(let i=0;i<9;i++){
        if(!bs[i]){
          bs[i] = PLAYER
          const val = minimax(bs, depth+1, true)
          bs[i] = null
          best = Math.  min(best, val)
        }
      }
      return best
    }
  }

  let bestVal = -Infinity
  let move = null
  for(let i=0;i<9;i++){
    if(!board[i]){
      board[i] = AI
      const val = minimax(board, 0, false)
      board[i] = null
      if(val > bestVal){
        bestVal = val
        move = i
      }
    }
  }
  return move ??    board.  findIndex(x => !  x)
}

function getAIMove(board){
  const emptyIndices = board.map((v,i) => v ?    null : i).  filter(x => x !== null)
  if(emptyIndices.length === 0) return null

  if(Math.random() < 0.90){
    return bestMove(board)
  } else {
    return emptyIndices[Math.floor(Math.  random() * emptyIndices.  length)]
  }
}

const FlowerIcon = ({ ...  props }) => (
  <Box 
    display="flex" 
    alignItems="center" 
    justifyContent="center" 
    w="100%" 
    h="100%"
    {...props}
  >
    <Text fontSize="48px" lineHeight="1">❀</Text>
  </Box>
)

const LeafIcon = ({ ... props }) => (
  <Box 
    display="flex" 
    alignItems="center" 
    justifyContent="center" 
    w="100%" 
    h="100%"
    {...props}
  >
    <Text fontSize="48px" lineHeight="1">✿</Text>
  </Box>
)

export default function GameBoard(){
  const [board, setBoard] = useState(Array(9). fill(null))
  const [status, setStatus] = useState('Твой ход')
  const [gameOver, setGameOver] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  const [promo, setPromo] = useState(null)
  const [token, setToken] = useState(null)
  const [wins, setWins] = useState(0)
  const [losses, setLosses] = useState(0)
  const [draws, setDraws] = useState(0)
  const [modalMessage, setModalMessage] = useState('')
  const [modalBodyText, setModalBodyText] = useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  useEffect(() => {
    requestToken()
  }, [])

  async function requestToken(){
    try{
      const res = await fetch('/api/token')
      if(res.ok){
        const data = await res.json()
        setToken(data.token)
      } else {
        toast({
          title: 'Упс, что-то пошло не так',
          description: 'Попробуй обновить страницу',
          status: 'error',
          duration: 3000,
          isClosable: true
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  function reset(){
    setBoard(Array(9).fill(null))
    setStatus('Твой ход')
    setGameOver(false)
    setAiThinking(false)
    setPromo(null)
    setModalMessage('')
    setModalBodyText('')
    requestToken()
  }

  function handleClick(i){
    if(gameOver || board[i] || aiThinking) return
    
    const newBoard = [... board]
    newBoard[i] = PLAYER
    setBoard(newBoard)
    
    const res = checkResult(newBoard)
    if(res) return finalize(res)
    
    setAiThinking(true)
    setTimeout(() => {
      makeAIMove(newBoard)
    }, 600)
  }

  function makeAIMove(currentBoard){
    const aiMove = getAIMove(currentBoard. slice())
    if(aiMove !== null){
      const newBoard = [...currentBoard]
      newBoard[aiMove] = AI
      setBoard(newBoard)
      setAiThinking(false)
      
      const res = checkResult(newBoard)
      if(res) return finalize(res)
    } else {
      setAiThinking(false)
    }
  }

  async function finalize(res){
    // Защита от повторного вызова
    if(gameOver) return
    
    setGameOver(true)
    setAiThinking(false)
    
    if(res.winner === PLAYER){
      const message = getRandomMessage(WIN_MESSAGES)
      setModalMessage(message)
      setModalBodyText('')
      setStatus('Победа!')
      setWins(w => w + 1)
      const code = generatePromo()
      setPromo(code)
      onOpen()
      await notifyServer('win', code)
    } else if(res.winner === AI){
      const message = getRandomMessage(LOSE_MESSAGES)
      const bodyText = getRandomMessage(LOSE_BODY_MESSAGES)
      setModalMessage(message)
      setModalBodyText(bodyText)
      setStatus('Не в этот раз')
      setLosses(l => l + 1)
      onOpen()
      await notifyServer('lose')
    } else {
      const message = getRandomMessage(DRAW_MESSAGES)
      const bodyText = getRandomMessage(DRAW_BODY_MESSAGES)
      setModalMessage(message)
      setModalBodyText(bodyText)
      setStatus('Ничья')
      setDraws(d => d + 1)
      onOpen()
      await notifyServer('draw')
    }
    requestToken()
  }

  async function notifyServer(result, code){
    try{
      await fetch('/api/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': token || ''
        },
        body: JSON.stringify({ result, code })
      })
    }catch(err){
      console.  error(err)
    }
  }

  return (
    <VStack spacing={8} position="relative">
      <HStack spacing={4} flexWrap="wrap" justifyContent="center">
        <Badge 
          colorScheme="green" 
          fontSize="md" 
          px={4} 
          py={2} 
          borderRadius="full"
          boxShadow="0 4px 12px rgba(109, 141, 109, 0.25)"
        >
          🏆 Побед: {wins}
        </Badge>
        <Badge 
          colorScheme="pink" 
          fontSize="md" 
          px={4} 
          py={2} 
          borderRadius="full"
          boxShadow="0 4px 12px rgba(217, 117, 145, 0.25)"
        >
          😔 Поражений: {losses}
        </Badge>
        <Badge 
          colorScheme="purple" 
          fontSize="md" 
          px={4} 
          py={2} 
          borderRadius="full"
          boxShadow="0 4px 12px rgba(107, 126, 194, 0.25)"
        >
          🤝 Ничьих: {draws}
        </Badge>
      </HStack>

      <Text 
        color="indigo.700" 
        fontSize="xl" 
        fontWeight="600"
        animation={aiThinking ? `${pulse} 1. 5s infinite` : 'none'}
      >
        {aiThinking ? 'Компьютер думает...' : status}
      </Text>

      <Box
        bg="linear-gradient(135deg, rgba(255,255,255,0.  98), rgba(246,248,246,0. 98))"
        p={6}
        borderRadius="24px"
        boxShadow="0 12px 48px rgba(75, 85, 99, 0.18)"
        border="2px solid"
        borderColor="gold.300"
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: '24px',
          background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.  w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4a93d\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.4,
          pointerEvents: 'none'
        }}
        opacity={aiThinking ? 0.6 : 1}
        transition="opacity 0.3s"
      >
        <SimpleGrid columns={3} spacing={4} w="340px" h="340px">
          {board.map((cell, i) => (
            <Box
              key={i}
              bg="white"
              borderRadius="20px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor={cell || gameOver || aiThinking ? 'default' : 'pointer'}
              onClick={() => handleClick(i)}
              position="relative"
              border="2px solid"
              borderColor={cell ? 'transparent' : 'sage.200'}
              boxShadow={cell ? 'inset 0 2px 8px rgba(0,0,0,0.08)' : '0 2px 12px rgba(168,189,168,0.15)'}
              w="105px"
              h="105px"
              minW="105px"
              minH="105px"
              _hover={{ 
                transform: cell || gameOver || aiThinking ? 'none' : 'translateY(-4px) scale(1.02)',
                boxShadow: cell || gameOver || aiThinking ? undefined : '0 8px 24px rgba(168,189,168,0.3)',
                borderColor: cell || gameOver || aiThinking ? undefined : 'gold.400'
              }}
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            >
              {cell === PLAYER && <FlowerIcon color="brand.500" />}
              {cell === AI && <LeafIcon color="sage.600" />}
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Button 
        variant="secondary" 
        size="lg" 
        onClick={reset}
      >
        🔄 Начать заново
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(10px)" />
        <ModalContent 
          borderRadius="24px" 
          mx={4}
          bg="white"
          boxShadow="0 20px 60px rgba(75, 85, 99, 0.3)"
        >
          <ModalHeader 
            fontSize="3xl" 
            fontFamily="heading"
            color={promo ? 'brand.600' : 'indigo.700'}
            pt={8}
            textAlign="center"
          >
            {modalMessage}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {promo ?   (
              <VStack spacing={4}>
                <Text color="sage.600" fontSize="lg" textAlign="center">
                  Твой эксклюзивный промокод:
                </Text>
                <Box 
                  bg="linear-gradient(135deg, #fef5f7, #fdf5e0)"
                  px={8} 
                  py={4} 
                  borderRadius="16px" 
                  border="2px solid"
                  borderColor="gold.300"
                  boxShadow="0 4px 20px rgba(212, 169, 61, 0.2)"
                  position="relative"
                  overflow="hidden"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '200%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                    animation: `${shimmer} 3s infinite`
                  }}
                >
                  <Text 
                    fontSize="4xl" 
                    fontWeight="bold" 
                    color="indigo.700" 
                    letterSpacing="wider"
                    fontFamily="heading"
                    textAlign="center"
                  >
                    {promo}
                  </Text>
                </Box>
                <Text color="sage.500" fontSize="sm" textAlign="center" fontStyle="italic">
                  ✨ Промокод отправлен в твой Telegram-бот 
                </Text>
              </VStack>
            ) : (
              <VStack spacing={3}>
                <Text color="sage.600" fontSize="lg" textAlign="center">
                  {modalBodyText}
                </Text>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter justifyContent="center" pb={8}>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={() => { onClose(); reset(); }}
              mr={3}
            >
              {promo ? 'Сыграть ещё' : 'Ещё разок!  '}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Закрыть
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}