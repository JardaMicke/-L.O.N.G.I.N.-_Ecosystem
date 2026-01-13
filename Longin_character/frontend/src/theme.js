import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    50: '#ffe5f2',
    100: '#ffb8d9',
    200: '#ff8ac0',
    300: '#ff5ca7',
    400: '#ff2e8e',
    500: '#ff0075',
    600: '#cc005d',
    700: '#990046',
    800: '#66002f',
    900: '#330017',
  },
  accent: {
    50: '#f3e5ff',
    100: '#d3b8ff',
    200: '#b38aff',
    300: '#935cff',
    400: '#732eff',
    500: '#5400ff',
    600: '#4300cc',
    700: '#320099',
    800: '#220066',
    900: '#110033',
  }
};

const styles = {
  global: (props) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
      color: props.colorMode === 'dark' ? 'white' : 'gray.800',
    },
  }),
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: 'bold',
      borderRadius: 'lg',
    },
    variants: {
      solid: (props) => ({
        bg: props.colorMode === 'dark' ? 'brand.500' : 'brand.500',
        color: 'white',
        _hover: {
          bg: props.colorMode === 'dark' ? 'brand.600' : 'brand.400',
        },
      }),
      outline: (props) => ({
        borderColor: props.colorMode === 'dark' ? 'brand.500' : 'brand.500',
        color: props.colorMode === 'dark' ? 'brand.500' : 'brand.500',
        _hover: {
          bg: props.colorMode === 'dark' ? 'rgba(255, 0, 117, 0.1)' : 'rgba(255, 0, 117, 0.1)',
        },
      }),
    },
  },
  Card: {
    baseStyle: (props) => ({
      container: {
        bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
        boxShadow: 'md',
        borderRadius: 'lg',
      },
    }),
  },
};

const theme = extendTheme({ config, colors, styles, components });

export default theme;