import React, { useState, useEffect } from 'react'
import {
  Box, SimpleGrid, Text, Button, useDisclosure, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, VStack,
  HStack, Badge, useToast
} from '@chakra-ui/react'
import { StarIcon } from '@chakra-ui/icons'

const PLAYER = 'X'
const AI = 'O'

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
          best = Math. min(best, val)
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
  return move ??  board. findIndex(x => ! x)
}

// AI точен в 90% случаев (шанс победы игрока ~10%)
function getAIMove(board){
  const emptyIndices = board.map((v,i) => v ?  null : i). filter(x => x !== null)
  if(emptyIndices.length === 0) return null

  if(Math.random() < 0.90){
    // 90% — оптимальный ход
    return bestMove(board)
  } else {
    // 10% — случайный ход
    return emptyIndices[Math. floor(Math.random() * emptyIndices.length)]
  }
}

export default function GameBoard(){
  const [board, setBoard] = useState(Array(9).fill(null))
  const [status, setStatus] = useState('Ваш ход — X')
  const [gameOver, setGameOver] = useState(false)
  const [aiThinking, setAiThinking] = useState(false) // блокировка кликов во время хода AI
  const [promo, setPromo] = useState(null)
  const [token, setToken] = useState(null)
  const [wins, setWins] = useState(0)
  const [losses, setLosses] = useState(0)
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
        console.log('✅ Token received:', data.token)
      } else {
        console.warn('❌ Token request failed:', res.status)
        toast({
          title: 'Ошибка получения токена',
          description: 'Попробуйте обновить страницу',
          status: 'error',
          duration: 3000,
          isClosable: true
        })
      }
    } catch (err) {
      console.error('❌ Token error:', err)
    }
  }

  function reset(){
    setBoard(Array(9).fill(null))
    setStatus('Ваш ход — X')
    setGameOver(false)
    setAiThinking(false)
    setPromo(null)
    requestToken()
  }

  function handleClick(i){
    // Блокируем клики если игра окончена, клетка занята или AI думает
    if(gameOver || board[i] || aiThinking) return
    
    const newBoard = [...board]
    newBoard[i] = PLAYER
    setBoard(newBoard)
    
    const res = checkResult(newBoard)
    if(res) return finalize(res)
    
    // AI ход с задержкой
    setAiThinking(true)
    setTimeout(() => {
      makeAIMove(newBoard)
    }, 400)
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
    setGameOver(true)
    setAiThinking(false)
    
    if(res.winner === PLAYER){
      setStatus('Вы победили!  🎉')
      setWins(w => w + 1)
      const code = generatePromo()
      setPromo(code)
      onOpen()
      await notifyServer('win', code)
    } else if(res.winner === AI){
      setStatus('Вы проиграли 😔')
      setLosses(l => l + 1)
      onOpen()
      await notifyServer('lose')
    } else {
      setStatus('Ничья 🤝')
      onOpen()
      await notifyServer('draw')
    }
    requestToken()
  }

  async function notifyServer(result, code){
    try{
      console.log('🔐 Sending result:', result, 'with token:', token)
      const response = await fetch('/api/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': token || ''
        },
        body: JSON.stringify({ result, code })
      })
      
      if(response.ok){
        console.log('✅ Result sent successfully')
      } else {
        const err = await response.text()
        console.warn('❌ Server rejected:', response.status, err)
        toast({
          title: 'Ошибка отправки результата',
          description: `Статус: ${response.status}`,
          status: 'error',
          duration: 5000,
          isClosable: true
        })
      }
    }catch(err){
      console. error('❌ Notify failed:', err)
      toast({
        title: 'Ошибка сети',
        description: 'Не удалось отправить результат',
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  return (
    <VStack spacing={6} position="relative">
      <HStack position="absolute" top="-20px" left="50%" transform="translateX(-50%)" spacing={2}>
        <StarIcon color="brand.300" />
        <StarIcon color="brand.400" boxSize={5} />
        <StarIcon color="brand.300" />
      </HStack>

      <HStack spacing={4}>
        <Badge colorScheme="green" fontSize="md" px={3} py={1} borderRadius="full">
          🏆 Побед: {wins}
        </Badge>
        <Badge colorScheme="red" fontSize="md" px={3} py={1} borderRadius="full">
          😔 Поражений: {losses}
        </Badge>
      </HStack>

      <Text color="gray.700" fontSize="lg" fontWeight="500">
        {aiThinking ? 'Компьютер думает...' : status}
      </Text>

      <Box
        bg="linear-gradient(135deg, #ffd6e8 0%, #ffe6ef 100%)"
        p={5}
        borderRadius="20px"
        boxShadow="0 8px 24px rgba(255,127,179,0.15)"
        position="relative"
        opacity={aiThinking ? 0.7 : 1}
        transition="opacity 0.3s"
      >
        <SimpleGrid columns={3} spacing={3} w="320px" h="320px">
          {board.map((cell, i) => (
            <Box
              key={i}
              bg="white"
              borderRadius="16px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="52px"
              fontWeight="700"
              cursor={cell || gameOver || aiThinking ? 'default' : 'pointer'}
              onClick={()=> handleClick(i)}
              _hover={{ 
                transform: cell || gameOver || aiThinking ? 'none' : 'translateY(-6px) scale(1.05)',
                boxShadow: cell || gameOver || aiThinking ? 'none' : '0 6px 18px rgba(255,127,179,0.25)'
              }}
              transition="all 0.2s"
              color={cell === PLAYER ? 'brand.600' : 'purple.500'}
            >
              {cell}
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      <Button 
        variant="ghostPink" 
        size="lg" 
        onClick={reset}
        _hover={{ transform: 'translateY(-2px)' }}
        transition="all 0.2s"
      >
        🔄 Начать заново
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent borderRadius="20px" mx={4}>
          <ModalHeader fontSize="2xl">{promo ? '🎉 Победа!' : status}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {promo ?  (
              <VStack spacing={3}>
                <Text>Ваш промокод на скидку:</Text>
                <Box 
                  bg="brand.50" 
                  px={6} 
                  py={3} 
                  borderRadius="12px" 
                  border="2px dashed"
                  borderColor="brand. 400"
                >
                  <Text 
                    fontSize="3xl" 
                    fontWeight="bold" 
                    color="brand.700" 
                    letterSpacing="3px"
                    fontFamily="mono"
                  >
                    {promo}
                  </Text>
                </Box>
                <Text color="gray.500" fontSize="sm">✉️ Промокод отправлен в Telegram-бот</Text>
              </VStack>
            ) : (
              <Text>Хотите попробовать ещё раз?</Text>
            )}
          </ModalBody>

          <ModalFooter>
            <Button mr={3} onClick={() => { onClose(); reset(); }} size="lg">
              🎮 Сыграть ещё
            </Button>
            <Button variant="primary" onClick={onClose} size="lg">
              Закрыть
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}