import '@testing-library/jest-native/extend-expect';
import { configure } from '@testing-library/react-native';

// Configure testing-library
configure({
  testIdAttribute: 'testID',
}); 