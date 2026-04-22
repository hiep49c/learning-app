/**
 * Tests for CourseTree component.
 *
 * All modules are freely accessible — no locking system.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { CourseTree } from '../CourseTree';

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

const mockModules = [
  {
    id: 'mod-1',
    title: 'Java Core',
    titleVi: 'Java Cơ Bản',
    description: 'Basics of Java',
    orderIndex: 1,
    difficultyLevel: 'beginner',
    iconName: 'language-java',
    lessonCount: 2,
    lessons: [
      { id: 'les-1', title: 'Variables', titleVi: 'Biến', orderIndex: 1 },
      { id: 'les-2', title: 'Operators', titleVi: 'Toán tử', orderIndex: 2 },
    ],
  },
  {
    id: 'mod-2',
    title: 'Java OOP',
    titleVi: 'Java OOP',
    description: 'Object-Oriented Programming',
    orderIndex: 2,
    difficultyLevel: 'intermediate',
    iconName: 'shape-outline',
    lessonCount: 1,
    lessons: [
      { id: 'les-3', title: 'Classes', titleVi: 'Lớp & Đối tượng', orderIndex: 1 },
    ],
  },
];

describe('CourseTree', () => {
  it('renders all modules', () => {
    const { getByLabelText } = renderWithTheme(
      <CourseTree
        modules={mockModules}
        expandedModules={{}}
        onToggleModule={jest.fn()}
        onSelectLesson={jest.fn()}
        moduleProgress={{}}
        completedLessons={new Set()}
      />,
    );

    expect(getByLabelText('Module: Java Cơ Bản, đã đóng')).toBeTruthy();
    expect(getByLabelText('Module: Java OOP, đã đóng')).toBeTruthy();
  });

  it('shows lessons when module is expanded', () => {
    const { getByText } = renderWithTheme(
      <CourseTree
        modules={mockModules}
        expandedModules={{ 'mod-1': true }}
        onToggleModule={jest.fn()}
        onSelectLesson={jest.fn()}
        moduleProgress={{}}
        completedLessons={new Set()}
      />,
    );

    expect(getByText('Biến')).toBeTruthy();
    expect(getByText('Toán tử')).toBeTruthy();
  });

  it('calls onSelectLesson when a lesson is pressed', () => {
    const onSelectLesson = jest.fn();
    const { getByText } = renderWithTheme(
      <CourseTree
        modules={mockModules}
        expandedModules={{ 'mod-1': true }}
        onToggleModule={jest.fn()}
        onSelectLesson={onSelectLesson}
        moduleProgress={{}}
        completedLessons={new Set()}
      />,
    );

    fireEvent.press(getByText('Biến'));
    expect(onSelectLesson).toHaveBeenCalledWith('les-1');
  });

  it('marks completed lessons', () => {
    const { getByLabelText } = renderWithTheme(
      <CourseTree
        modules={mockModules}
        expandedModules={{ 'mod-1': true }}
        onToggleModule={jest.fn()}
        onSelectLesson={jest.fn()}
        moduleProgress={{}}
        completedLessons={new Set(['les-1'])}
      />,
    );

    expect(getByLabelText('Biến, đã hoàn thành')).toBeTruthy();
  });

  it('renders empty list without crashing', () => {
    const { toJSON } = renderWithTheme(
      <CourseTree
        modules={[]}
        expandedModules={{}}
        onToggleModule={jest.fn()}
        onSelectLesson={jest.fn()}
        moduleProgress={{}}
        completedLessons={new Set()}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
