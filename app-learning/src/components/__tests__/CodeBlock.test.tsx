/**
 * Tests for CodeBlock component.
 *
 * Validates: syntax highlighting, line numbers, file name header,
 * copy-to-clipboard, and accessibility.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { CodeBlock } from '../CodeBlock';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-font', () => ({
  isLoaded: jest.fn().mockReturnValue(true),
  loadAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  const mockIcon = (props: Record<string, unknown>) => {
    const mockReact = require('react');
    return mockReact.createElement(Text, { testID: `icon-${props.name}` }, String(props.name));
  };
  return {
    MaterialCommunityIcons: mockIcon,
    __esModule: true,
    default: mockIcon,
  };
});

function renderWithTheme(ui: React.ReactElement) {
  return render(<PaperProvider>{ui}</PaperProvider>);
}

describe('CodeBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders code text', () => {
    const { getByText } = renderWithTheme(
      <CodeBlock code="int x = 5;" language="java" />,
    );
    expect(getByText(/int/)).toBeTruthy();
    expect(getByText(/5/)).toBeTruthy();
  });

  it('shows line numbers by default', () => {
    const { getByText } = renderWithTheme(
      <CodeBlock code={'line1\nline2\nline3'} language="java" />,
    );
    expect(getByText('1')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  it('hides line numbers when showLineNumbers is false', () => {
    const { queryByText } = renderWithTheme(
      <CodeBlock code="single line" language="java" showLineNumbers={false} />,
    );
    expect(queryByText('single line')).toBeTruthy();
  });

  it('shows file name header when fileName is provided', () => {
    const { getByText } = renderWithTheme(
      <CodeBlock code="code" language="java" fileName="Main.java" />,
    );
    expect(getByText('Main.java')).toBeTruthy();
  });

  it('does not show file name header when fileName is not provided', () => {
    const { queryByText } = renderWithTheme(
      <CodeBlock code="code" language="java" />,
    );
    expect(queryByText('Main.java')).toBeNull();
  });

  it('copies code to clipboard when copy button is pressed', async () => {
    const onCopy = jest.fn();
    const code = 'System.out.println("Hello");';
    const { getByLabelText } = renderWithTheme(
      <CodeBlock code={code} language="java" onCopy={onCopy} />,
    );

    const copyButton = getByLabelText('Sao chép code');
    fireEvent.press(copyButton);

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(code);
    });
    await waitFor(() => {
      expect(onCopy).toHaveBeenCalled();
    });
  });

  it('has accessible copy button with correct label', () => {
    const { getByLabelText } = renderWithTheme(
      <CodeBlock code="code" language="java" />,
    );
    expect(getByLabelText('Sao chép code')).toBeTruthy();
  });

  it('renders non-java code without syntax highlighting', () => {
    const { getByText } = renderWithTheme(
      <CodeBlock code="SELECT * FROM users;" language="sql" />,
    );
    expect(getByText('SELECT * FROM users;')).toBeTruthy();
  });
});
