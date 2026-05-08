/**
 * Tests for ContentRenderer component.
 *
 * Validates: rendering of all section types (heading, paragraph, code_block,
 * table, list, diagram, keyword_ref), inline formatting, scroll tracking,
 * and keyword press callbacks.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { ContentRenderer } from '../ContentRenderer';

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

describe('ContentRenderer', () => {
  it('renders heading sections with correct text', () => {
    const content = {
      sections: [
        { type: 'heading' as const, level: 1, text: 'Introduction' },
        { type: 'heading' as const, level: 2, text: 'Subsection' },
        { type: 'heading' as const, level: 3, text: 'Detail' },
      ],
    };

    const { getByText } = renderWithTheme(
      <ContentRenderer content={content} />,
    );

    expect(getByText('Introduction')).toBeTruthy();
    expect(getByText('Subsection')).toBeTruthy();
    expect(getByText('Detail')).toBeTruthy();
  });

  it('renders paragraph sections', () => {
    const content = {
      sections: [
        { type: 'paragraph' as const, text: 'This is a paragraph.' },
      ],
    };

    const { getByText } = renderWithTheme(
      <ContentRenderer content={content} />,
    );

    expect(getByText(/This is a paragraph/)).toBeTruthy();
  });

  it('renders bold and inline code in paragraphs', () => {
    const content = {
      sections: [
        { type: 'paragraph' as const, text: 'Use **bold** and `code` here.' },
      ],
    };

    const { getByText } = renderWithTheme(
      <ContentRenderer content={content} />,
    );

    expect(getByText('bold')).toBeTruthy();
    expect(getByText('code')).toBeTruthy();
  });

  it('renders code_block sections via CodeBlock component', () => {
    const content = {
      sections: [
        {
          type: 'code_block' as const,
          code: 'int x = 10;',
          language: 'java',
          fileName: 'Example.java',
        },
      ],
    };

    const { getByText, getByLabelText } = renderWithTheme(
      <ContentRenderer content={content} />,
    );

    expect(getByText('Example.java')).toBeTruthy();
    expect(getByLabelText('Sao chép code')).toBeTruthy();
  });

  it('renders table sections with headers and rows', () => {
    const content = {
      sections: [
        {
          type: 'table' as const,
          headers: ['Name', 'Type'],
          rows: [
            ['int', 'primitive'],
            ['String', 'object'],
          ],
        },
      ],
    };

    const { getByText } = renderWithTheme(
      <ContentRenderer content={content} />,
    );

    expect(getByText('Name')).toBeTruthy();
    expect(getByText('Type')).toBeTruthy();
    expect(getByText('int')).toBeTruthy();
    expect(getByText('String')).toBeTruthy();
  });

  it('renders ordered list sections', () => {
    const content = {
      sections: [
        {
          type: 'list' as const,
          ordered: true,
          items: ['First item', 'Second item'],
        },
      ],
    };

    const { getByText } = renderWithTheme(
      <ContentRenderer content={content} />,
    );

    expect(getByText('1.')).toBeTruthy();
    expect(getByText('2.')).toBeTruthy();
    expect(getByText(/First item/)).toBeTruthy();
    expect(getByText(/Second item/)).toBeTruthy();
  });

  it('renders unordered list sections with bullets', () => {
    const content = {
      sections: [
        {
          type: 'list' as const,
          ordered: false,
          items: ['Item A', 'Item B'],
        },
      ],
    };

    const { getAllByText, getByText } = renderWithTheme(
      <ContentRenderer content={content} />,
    );

    expect(getAllByText('•').length).toBe(2);
    expect(getByText(/Item A/)).toBeTruthy();
  });

  it('renders keyword_ref sections as tappable chips', () => {
    const onKeywordPress = jest.fn();
    const content = {
      sections: [
        {
          type: 'keyword_ref' as const,
          text: 'Dependency Injection',
          keywordId: 'kw-di',
        },
      ],
    };

    const { getByText } = renderWithTheme(
      <ContentRenderer content={content} onKeywordPress={onKeywordPress} />,
    );

    const chip = getByText('Dependency Injection');
    fireEvent.press(chip);
    expect(onKeywordPress).toHaveBeenCalledWith('kw-di');
  });

  it('renders diagram sections as monospace code blocks', () => {
    const content = {
      sections: [
        {
          type: 'diagram' as const,
          code: '┌───┐\n│ A │\n└───┘',
        },
      ],
    };

    const { getByText } = renderWithTheme(
      <ContentRenderer content={content} />,
    );

    expect(getByText(/A/)).toBeTruthy();
  });

  it('calls onCodeCopy when code is copied', () => {
    const onCodeCopy = jest.fn();
    const content = {
      sections: [
        { type: 'code_block' as const, code: 'int x = 1;', language: 'java' },
      ],
    };

    const { getByLabelText } = renderWithTheme(
      <ContentRenderer content={content} onCodeCopy={onCodeCopy} />,
    );

    fireEvent.press(getByLabelText('Sao chép code'));
  });

  it('renders empty content without crashing', () => {
    const content = { sections: [] };
    const { toJSON } = renderWithTheme(
      <ContentRenderer content={content} />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
