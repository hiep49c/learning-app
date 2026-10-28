import { MD3LightTheme, MD3DarkTheme, type MD3Theme } from 'react-native-paper';

const brand = {
  primary: '#0E7A5F',
  secondary: '#B5651D',
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brand.primary,
    secondary: brand.secondary,
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4CC7A4',
    secondary: '#E3A66B',
  },
};
