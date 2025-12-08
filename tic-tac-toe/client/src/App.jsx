import React from 'react'
import { Box, Container, Heading, Text, VStack, HStack, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react'
import GameBoard from './components/GameBoard'

export default function App(){
  return (
    <Box 
      minH="100vh" 
      bgGradient="linear(135deg, #ffd6f0 0%, #c4f5d4 30%, #d4e0ff 70%, #ffd6f0 100%)"
      bgSize="400% 400%"
      animation="gradientShift 15s ease infinite"
      py={10}
      position="relative"
      overflow="hidden"
      sx={{
        '@keyframes gradientShift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        }
      }}
    >
      <Box
        position="absolute"
        top="10%"
        right="5%"
        opacity={0.15}
        fontSize="200px"
        color="gold.400"
        transform="rotate(15deg)"
        pointerEvents="none"
        animation="float 6s ease-in-out infinite"
        sx={{
          '@keyframes float': {
            '0%, 100%': { transform: 'rotate(15deg) translateY(0px)' },
            '50%': { transform: 'rotate(15deg) translateY(-20px)' }
          }
        }}
      >
        ✦
      </Box>
      <Box
        position="absolute"
        bottom="15%"
        left="8%"
        opacity={0.12}
        fontSize="150px"
        color="sage.400"
        transform="rotate(-20deg)"
        pointerEvents="none"
        animation="float 8s ease-in-out infinite"
      >
        ❀
      </Box>
      <Box
        position="absolute"
        top="40%"
        left="10%"
        opacity={0.1}
        fontSize="100px"
        color="brand.400"
        pointerEvents="none"
        animation="float 7s ease-in-out infinite 1s"
      >
        ✿
      </Box>
      <Box
        position="absolute"
        top="60%"
        right="15%"
        opacity={0.12}
        fontSize="120px"
        color="indigo.400"
        pointerEvents="none"
        animation="float 9s ease-in-out infinite 0.5s"
      >
        ◆
      </Box>

      <Container maxW="4xl" position="relative" zIndex={1}>
        <VStack spacing={12} align="stretch">
          <Box textAlign="center">
            <Heading 
              size="3xl" 
              fontFamily="heading" 
              color="indigo.800"
              mb={3}
              fontWeight="700"
              letterSpacing="tight"
              textShadow="0 2px 8px rgba(46, 58, 104, 0.15)"
            >
              Крестики‑нолики
            </Heading>
            <Text 
              color="sage.700" 
              fontSize="xl" 
              fontWeight="500"
              fontStyle="italic"
            >
              Сыграй и получи эксклюзивный промокод
            </Text>
          </Box>

          <GameBoard />

          <Box 
            bg="whiteAlpha.900"
            backdropFilter="blur(20px)"
            p={8} 
            borderRadius="24px"
            boxShadow="0 8px 32px rgba(75, 85, 99, 0.12)"
            border="1px solid"
            borderColor="whiteAlpha.800"
          >
            <Heading size="lg" fontFamily="heading" color="indigo.700" mb={4} textAlign="center">
              ✨ Как играть
            </Heading>
            <VStack spacing={4} align="start">
              <HStack>
                <Box w="8px" h="8px" borderRadius="full" bg="brand.400" />
                <Text color="gray.700">Ты играешь <strong>цветами ❀</strong>, компьютер — <strong>листьями ✿</strong></Text>
              </HStack>
              <HStack>
                <Box w="8px" h="8px" borderRadius="full" bg="sage.500" />
                <Text color="gray.700">Цель — выстроить <strong>три</strong> своих символа в ряд</Text>
              </HStack>
              <HStack>
                <Box w="8px" h="8px" borderRadius="full" bg="gold.400" />
                <Text color="gray.700">При победе ты получаешь <strong>5-значный промокод</strong></Text>
              </HStack>
              <HStack>
                <Box w="8px" h="8px" borderRadius="full" bg="indigo.400" />
                <Text color="gray.700">Промокод автоматически отправляется в Telegram-бот <strong> @PlayPromo_Bot </strong></Text>
              </HStack>
            </VStack>
          </Box>

          <Box 
            bg="whiteAlpha.900"
            backdropFilter="blur(20px)"
            p={8} 
            borderRadius="24px"
            boxShadow="0 8px 32px rgba(75, 85, 99, 0. 12)"
            border="1px solid"
            borderColor="whiteAlpha.800"
          >
            <Heading size="lg" fontFamily="heading" color="indigo.700" mb={6} textAlign="center">
              💡 Частые вопросы
            </Heading>
            <Accordion allowToggle>
              <AccordionItem border="none" mb={2}>
                <AccordionButton 
                  bg="sage.50" 
                  borderRadius="12px" 
                  _hover={{ bg: 'sage.100' }}
                  py={4}
                >
                  <Box flex="1" textAlign="left" fontWeight="500" color="sage.800">
                    Почему так сложно выиграть?
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4} pt={4} color="gray.700">
                  Компьютер играет на высоком уровне (точность 90%). Это делает победу особенно ценной!  Используй тактику и внимательно следи за ходами
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem border="none" mb={2}>
                <AccordionButton 
                  bg="brand.50" 
                  borderRadius="12px" 
                  _hover={{ bg: 'brand.100' }}
                  py={4}
                >
                  <Box flex="1" textAlign="left" fontWeight="500" color="brand.800">
                    Куда придёт промокод?
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4} pt={4} color="gray. 700">
                  После победы промокод мгновенно отправляется в твой Telegram-бот.  Убедись, что ты подключена к боту перед игрой
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem border="none">
                <AccordionButton 
                  bg="indigo. 50" 
                  borderRadius="12px" 
                  _hover={{ bg: 'indigo.100' }}
                  py={4}
                >
                  <Box flex="1" textAlign="left" fontWeight="500" color="indigo.800">
                    Можно ли играть несколько раз?
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4} pt={4} color="gray.700">
                  Конечно! Играй сколько угодно раз. Каждая победа — новый уникальный промокод. 
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>

          <Box 
            textAlign="center" 
            bg="linear-gradient(135deg, #f28ca6 0%, #d97591 100%)"
            color="white"
            p={8} 
            borderRadius="24px"
            boxShadow="0 12px 40px rgba(242, 140, 166, 0.3)"
          >
            <Heading size="lg" fontFamily="heading" mb={3}>
              Готова попробовать?  🎯
            </Heading>
            <Text fontSize="lg" opacity={0.95}>
              Сыграй прямо сейчас и получи эксклюзивный промокод на скидку! 
            </Text>
          </Box>

          <Box textAlign="center" fontSize="sm" color="gray. 600" py={4}>
            <Text>Сделано с ❤️ для женщин </Text>
            <Text mt={1} fontSize="xs" color="gray.500">
              © 2025 Крестики-нолики. Все права защищены. 
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}