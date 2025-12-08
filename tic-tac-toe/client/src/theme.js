import { extendTheme } from '@chakra-ui/react'

const colors = {
  brand: {
    50: '#fff5f8',
    100: '#ffe6ef',
    200: '#ffccdf',
    300: '#ffb3cf',
    400: '#ff8fb3',
    500: '#ff6aa0',
    600: '#e64f8a',
    700: '#b43a67',
    800: '#87283f',
    900: '#541423'
  },
  accent: {
    50: '#fff8fb',
    100: '#fff0f6',
    200: '#ffe6ef',
    300: '#ffd6e8'
  }
}

const theme = extendTheme({
  colors,
  fonts: {
    heading: '"Poppins", sans-serif',
    body: '"Inter", sans-serif'
  },
  styles: {
    global: {
      body: {
        bg: 'accent.50'
      }
    }
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: '12px'
      },
      variants: {
        primary: {
          bg: 'brand.500',
          color: 'white',
          _hover: { bg: 'brand.600' }
        },
        ghostPink: {
          bg: 'transparent',
          color: 'brand.500',
          border: '2px solid',
          borderColor: 'brand.200',
          _hover: { bg: 'brand.50' }
        }
      }
    }
  }
})

export default theme