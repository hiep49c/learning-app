/**
 * Tests for QuizCard component.
 *
 * Validates: question rendering, option selection, submission states,
 * correct/incorrect highlighting, explanation display, and accessibility.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { QuizCard } from '../QuizCard';

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

const mockQuestion = {
  id: 'q-1',
  questionText: 'What is the default value of an int in Java?',
  options: ['0', 'null', 'undefined', '1'],
  orderIndex: 1,
};

describe('QuizCard', () => {
  it('renders the question text', () => {
    const { getByText } = renderWithTheme(
      <QuizCard
        question={mockQuestion}
        selectedAnswer={null}
        onSelectAnswer={jest.fn()}
        isSubmitted={false}
      />,
    );

    expect(getByText('What is the default value of an int in Java?')).toBeTruthy();
  });

  it('renders all options', () => {
    const { getByText } = renderWithTheme(
      <QuizCard
        question={mockQuestion}
        selectedAnswer={null}
        onSelectAnswer={jest.fn()}
        isSubmitted={false}
      />,
    );

    expect(getByText(/0/)).toBeTruthy();
    expect(getByText(/null/)).toBeTruthy();
    expect(getByText(/undefined/)).toBeTruthy();
  });

  it('calls onSelectAnswer when an option is pressed', () => {
    const onSelectAnswer = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <QuizCard
        question={mockQuestion}
        selectedAnswer={null}
        onSelectAnswer={onSelectAnswer}
        isSubmitted={false}
      />,
    );

    const radioButton = getByLabelText('A. 0');
    fireEvent.press(radioButton);
    expect(onSelectAnswer).toHaveBeenCalledWith('0');
  });

  it('does not call onSelectAnswer when submitted', () => {
    const onSelectAnswer = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <QuizCard
        question={mockQuestion}
        selectedAnswer="0"
        onSelectAnswer={onSelectAnswer}
        isSubmitted={true}
        correctAnswer="0"
      />,
    );

    const radioButton = getByLabelText('A. 0');
    fireEvent.press(radioButton);
    expect(onSelectAnswer).not.toHaveBeenCalled();
  });

  it('shows correct message when answer is correct', () => {
    const { getByText } = renderWithTheme(
      <QuizCard
        question={mockQuestion}
        selectedAnswer="0"
        onSelectAnswer={jest.fn()}
        isSubmitted={true}
        correctAnswer="0"
      />,
    );

    expect(getByText(/Chính xác/)).toBeTruthy();
  });

  it('shows explanation when answer is wrong', () => {
    const { getByText } = renderWithTheme(
      <QuizCard
        question={mockQuestion}
        selectedAnswer="null"
        onSelectAnswer={jest.fn()}
        isSubmitted={true}
        correctAnswer="0"
        explanation="In Java, the default value of int is 0, not null."
      />,
    );

    expect(getByText('💡 Giải thích')).toBeTruthy();
    expect(getByText('In Java, the default value of int is 0, not null.')).toBeTruthy();
  });

  it('does not show explanation when answer is correct', () => {
    const { queryByText } = renderWithTheme(
      <QuizCard
        question={mockQuestion}
        selectedAnswer="0"
        onSelectAnswer={jest.fn()}
        isSubmitted={true}
        correctAnswer="0"
        explanation="Some explanation"
      />,
    );

    expect(queryByText('💡 Giải thích')).toBeNull();
  });

  it('has accessible radio buttons', () => {
    const { getByLabelText } = renderWithTheme(
      <QuizCard
        question={mockQuestion}
        selectedAnswer={null}
        onSelectAnswer={jest.fn()}
        isSubmitted={false}
      />,
    );

    expect(getByLabelText('A. 0')).toBeTruthy();
    expect(getByLabelText('B. null')).toBeTruthy();
    expect(getByLabelText('C. undefined')).toBeTruthy();
    expect(getByLabelText('D. 1')).toBeTruthy();
  });
});
