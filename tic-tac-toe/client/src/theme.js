import { extendTheme } from '@chakra-ui/react'

const colors = {
  brand: {
    50: '#fef5f7',
    100: '#fde8ed',
    200: '#fbd1db',
    300: '#f7a8bc',
    400: '#f28ca6',  
    500: '#d97591',
    600: '#b85d75',
    700: '#8f4558',
    800: '#6b3343',
    900: '#4a232f'
  },
  sage: {
    50: '#f6f8f6',
    100: '#e8ede8',
    200: '#d1dbd1',
    300: '#a8bda8',  
    400: '#8aa88a',
    500: '#6d8d6d',
    600: '#567256',
    700: '#425742',
    800: '#2f3f2f',
    900: '#1f2a1f'
  },
  indigo: {
    50: '#f0f2f8',
    100: '#dce1f0',
    200: '#b8c2e0',
    300: '#8a9bcf',  
    400: '#6b7ec2',
    500: '#4f62ab',
    600: '#3d4d8a',
    700: '#2e3a68',
    800: '#202849',
    900: '#151a30'
  },
  gold: {
    50: '#fefbf3',
    100: '#fdf5e0',
    200: '#fae8ba',
    300: '#f5d687',  
    400: '#efc45a',
    500: '#d4a93d',
    600: '#a88830',
    700: '#7d6424',
    800: '#564419',
    900: '#372a10'
  }
}

const theme = extendTheme({
  colors,
  fonts: {
    heading: '"Playfair Display", Georgia, serif',  
    body: '"Inter", -apple-system, system-ui, sans-serif'  
  },
  styles: {
    global: {
      body: {
        bg: 'linear-gradient(135deg, #fef5f7 0%, #f6f8f6 50%, #f0f2f8 100%)',
        color: 'gray.800'
      }
    }
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: '16px',
        fontWeight: '500',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      },
      variants: {
        primary: {
          bg: 'brand.400',
          color: 'white',
          boxShadow: '0 4px 14px rgba(242, 140, 166, 0.4)',
          _hover: { 
            bg: 'brand.500',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(242, 140, 166, 0.5)'
          },
          _active: { transform: 'translateY(0)' }
        },
        secondary: {
          bg: 'white',
          color: 'brand.600',
          border: '2px solid',
          borderColor: 'brand.200',
          _hover: { 
            bg: 'brand.50',
            borderColor: 'brand.300'
          }
        },
        ghost: {
          color: 'sage.600',
          _hover: { bg: 'sage.50' }
        }
      }
    },
    Badge: {
      baseStyle: {
        borderRadius: 'full',
        px: 4,
        py: 1,
        fontWeight: '500'
      }
    }
  }
})

export default theme