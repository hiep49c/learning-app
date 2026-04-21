/**
 * Tests for CourseTree component.
 *
 * Validates: module/lesson rendering, expand/collapse, difficulty badges,
 * progress bars, lock state, and accessibility.
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
    prerequisiteNames: [],
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
    prerequisiteNames: ['Java Cơ Bản'],
  },
];

describe('CourseTree', () => {
  it('renders all modules with accessibility labels', () => {
    const { getByLabelText } = renderWithTheme(
      <CourseTree
        modules={mockModules}
        expandedModules={new Set()}
        onToggleModule={jest.fn()}
        onSelectLesson={jest.fn()}
        moduleProgress={{}}
        unlockedModules={new Set(['mod-1', 'mod-2'])}
        completedLessons={new Set()}
      />,
    );

    expect(getByLabelText('Module: Java Cơ Bản')).toBeTruthy();
    expect(getByLabelText('Module: Java OOP')).toBeTruthy();
  });

  it('marks locked modules in accessibility label', () => {
    const { getByLabelText } = renderWithTheme(
      <CourseTree
        modules={mockModules}
        expandedModules={new Set()}
        onToggleModule={jest.fn()}
        onSelectLesson={jest.fn()}
        moduleProgress={{}}
        unlockedModules={new Set(['mod-1'])}
        completedLessons={new Set()}
      />,
    );

    // mod-1 is unlocked
    expect(getByLabelText('Module: Java Cơ Bản')).toBeTruthy();
    // mod-2 is locked
    expect(getByLabelText('Module: Java OOP, đã khóa')).toBeTruthy();
  });

  it('shows lessons when module is expanded', () => {
    const { getByText } = renderWithTheme(
      <CourseTree
        modules={mockModules}
        expandedModules={new Set(['mod-1'])}
        onToggleModule={jest.fn()}
        onSelectLesson={jest.fn()}
        moduleProgress={{}}
        unlockedModules={new Set(['mod-1'])}
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
        expandedModules={new Set(['mod-1'])}
        onToggleModule={jest.fn()}
        onSelectLesson={onSelectLesson}
        moduleProgress={{}}
        unlockedModules={new Set(['mod-1'])}
        completedLessons={new Set()}
      />,
    );

    fireEvent.press(getByText('Biến'));
    expect(onSelectLesson).toHaveBeenCalledWith('les-1');
  });

  it('marks completed lessons in accessibility label', () => {
    const { getByLabelText } = renderWithTheme(
      <CourseTree
        modules={mockModules}
        expandedModules={new Set(['mod-1'])}
        onToggleModule={jest.fn()}
        onSelectLesson={jest.fn()}
        moduleProgress={{}}
        unlockedModules={new Set(['mod-1'])}
        completedLessons={new Set(['les-1'])}
      />,
    );

    expect(getByLabelText('Biến, đã hoàn thành')).toBeTruthy();
  });

  it('renders empty modules list without crashing', () => {
    const { toJSON } = renderWithTheme(
      <CourseTree
        modules={[]}
        expandedModules={new Set()}
        onToggleModule={jest.fn()}
        onSelectLesson={jest.fn()}
        moduleProgress={{}}
        unlockedModules={new Set()}
        completedLessons={new Set()}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
