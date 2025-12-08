import React from 'react'
import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react'
import GameBoard from './components/GameBoard'

export default function App(){
  return (
    <Box 
      minH="100vh" 
      bg="linear-gradient(180deg, #fff8fb 0%, #ffffff 50%, #fff0f6 100%)"
      py={10}
    >
      <Container maxW="lg">
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading 
              size="2xl" 
              fontFamily="heading" 
              color="brand.800"
              mb={2}
              textShadow="0 2px 4px rgba(255,127,179,0.1)"
            >
              Крестики‑нолики
            </Heading>
            <Text color="gray.600" fontSize="lg">Нежная версия — выиграй промокод!</Text>
          </Box>

          <GameBoard />

          <Box 
            textAlign="center" 
            fontSize="sm" 
            color="gray.500" 
            bg="white" 
            p={4} 
            borderRadius="12px"
            boxShadow="sm"
          >
            <Text>💡 Играете против компьютера</Text>
            <Text mt={1}>При победе промокод отправляется в Telegram-бота</Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}