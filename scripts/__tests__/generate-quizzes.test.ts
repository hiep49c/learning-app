import {
  generateQuizzes,
  GeneratedQuiz,
  GeneratedQuestion,
  QuizGenerationResult,
} from '../generate-quizzes';
import type { ParsedLesson, ParsedKeyword } from '../parse-content';
import { parseAllContent } from '../parse-content';
import * as path from 'path';

// ─── Test Helpers ───

function makeKeyword(overrides: Partial<ParsedKeyword> = {}): ParsedKeyword {
  return {
    id: 'keyword-test',
    lessonId: 'lesson-01-01',
    name: 'TestKeyword',
    definition: 'A test keyword definition.',
    explanation: 'This is a detailed explanation of the test keyword.',
    codeExample: 'int x = 5;',
    category: 'java-core',
    ...overrides,
  };
}

function makeLesson(overrides: Partial<ParsedLesson> = {}): ParsedLesson {
  return {
    id: 'lesson-01-01',
    moduleId: 'module-01',
    title: 'Test Lesson',
    titleVi: 'Bài Học Test',
    description: 'A test lesson description.',
    orderIndex: 1,
    contentJson: { sections: [] },
    sourceFile: 'doc/01-java-core/01-test.md',
    estimatedMinutes: 10,
    keywords: [],
    codeExamples: [],
    ...overrides,
  };
}

function makeKeywords(count: number, lessonId: string, moduleCategory: string): ParsedKeyword[] {
  return Array.from({ length: count }, (_, i) => makeKeyword({
    id: `keyword-test-${i}`,
    lessonId,
    name: `Keyword${i}`,
    definition: `Definition for keyword ${i} in the lesson.`,
    explanation: `Detailed explanation for keyword ${i}. This covers important concepts.`,
    codeExample: `int val${i} = ${i};`,
    category: moduleCategory,
  }));
}

// ─── Unit Tests ───

describe('generateQuizzes', () => {
  describe('basic quiz generation', () => {
    it('generates one quiz per lesson', () => {
      const keywords = makeKeywords(4, 'lesson-01-01', 'java-core');
      const lesson = makeLesson({ keywords });
      const result = generateQuizzes([lesson], keywords);

      expect(result.quizzes).toHaveLength(1);
      expect(result.quizzes[0]?.id).toBe('quiz-lesson-01-01');
    });

    it('quiz title includes Vietnamese lesson title', () => {
      const keywords = makeKeywords(3, 'lesson-01-01', 'java-core');
      const lesson = makeLesson({ keywords, titleVi: 'Biến và Kiểu Dữ Liệu' });
      const result = generateQuizzes([lesson], keywords);

      expect(result.quizzes[0]?.title).toBe('Quiz: Biến và Kiểu Dữ Liệu');
    });

    it('generates at least 3 questions per quiz', () => {
      const keywords = makeKeywords(3, 'lesson-01-01', 'java-core');
      const lesson = makeLesson({ keywords });
      const result = generateQuizzes([lesson], keywords);

      const quizQuestions = result.questions.filter(
        (q) => q.quizId === 'quiz-lesson-01-01'
      );
      expect(quizQuestions.length).toBeGreaterThanOrEqual(3);
    });

    it('generates multiple quizzes for multiple lessons', () => {
      const kw1 = makeKeywords(3, 'lesson-01-01', 'java-core');
      const kw2 = makeKeywords(3, 'lesson-01-02', 'java-core');
      const lesson1 = makeLesson({ id: 'lesson-01-01', keywords: kw1 });
      const lesson2 = makeLesson({ id: 'lesson-01-02', keywords: kw2 });

      const allKeywords = [...kw1, ...kw2];
      const result = generateQuizzes([lesson1, lesson2], allKeywords);

      expect(result.quizzes).toHaveLength(2);
    });
  });

  describe('question structure', () => {
    it('every question has exactly 4 options', () => {
      const keywords = makeKeywords(5, 'lesson-01-01', 'java-core');
      const lesson = makeLesson({ keywords });
      const result = generateQuizzes([lesson], keywords);

      for (const question of result.questions) {
        expect(question.optionsJson).toHaveLength(4);
      }
    });

    it('correctAnswer matches one of the options exactly', () => {
      const keywords = makeKeywords(5, 'lesson-01-01', 'java-core');
      const lesson = makeLesson({ keywords });
      const result = generateQuizzes([lesson], keywords);

      for (const question of result.questions) {
        expect(question.optionsJson).toContain(question.correctAnswer);
      }
    });

    it('every question has questionType multiple_choice', () => {
      const keywords = makeKeywords(4, 'lesson-01-01', 'java-core');
      const lesson = makeLesson({ keywords });
      const result = generateQuizzes([lesson], keywords);

      for (const question of result.questions) {
        expect(question.questionType).toBe('multiple_choice');
      }
    });

    it('every question has a non-empty explanation', () => {
      const keywords = makeKeywords(4, 'lesson-01-01', 'java-core');
      const lesson = makeLesson({ keywords });
      const result = generateQuizzes([lesson], keywords);

      for (const question of result.questions) {
        expect(question.explanation.length).toBeGreaterThan(0);
      }
    });

    it('question IDs follow the expected pattern', () => {
      const keywords = makeKeywords(3, 'lesson-01-01', 'java-core');
      const lesson = makeLesson({ keywords });
      const result = generateQuizzes([lesson], keywords);

      for (const question of result.questions) {
        expect(question.id).toMatch(/^question-quiz-lesson-01-01-\d+$/);
      }
    });

    it('orderIndex is sequential starting from 0', () => {
      const keywords = makeKeywords(4, 'lesson-01-01', 'java-core');
      const lesson = makeLesson({ keywords });
      const result = generateQuizzes([lesson], keywords);

      const quizQuestions = result.questions
        .filter((q) => q.quizId === 'quiz-lesson-01-01')
        .sort((a, b) => a.orderIndex - b.orderIndex);

      for (let i = 0; i < quizQuestions.length; i++) {
        expect(quizQuestions[i]?.orderIndex).toBe(i);
      }
    });
  });

  describe('determinism', () => {
    it('produces identical output for identical input', () => {
      const keywords = makeKeywords(5, 'lesson-01-01', 'java-core');
      const lesson = makeLesson({ keywords });

      const result1 = generateQuizzes([lesson], keywords);
      const result2 = generateQuizzes([lesson], keywords);

      expect(result1.quizzes).toEqual(result2.quizzes);
      expect(result1.questions).toEqual(result2.questions);
    });

    it('option order is deterministic', () => {
      const keywords = makeKeywords(4, 'lesson-01-01', 'java-core');
      const lesson = makeLesson({ keywords });

      const result1 = generateQuizzes([lesson], keywords);
      const result2 = generateQuizzes([lesson], keywords);

      for (let i = 0; i < result1.questions.length; i++) {
        expect(result1.questions[i]?.optionsJson).toEqual(
          result2.questions[i]?.optionsJson
        );
      }
    });
  });

  describe('fallback strategy', () => {
    it('generates 3 questions even with fewer than 3 keywords', () => {
      const keywords = makeKeywords(2, 'lesson-01-01', 'java-core');
      const lesson = makeLesson({ keywords });
      const result = generateQuizzes([lesson], keywords);

      const quizQuestions = result.questions.filter(
        (q) => q.quizId === 'quiz-lesson-01-01'
      );
      expect(quizQuestions.length).toBeGreaterThanOrEqual(3);
    });

    it('generates 3 questions even with 1 keyword', () => {
      const keywords = makeKeywords(1, 'lesson-01-01', 'java-core');
      const lesson = makeLesson({ keywords });
      const result = generateQuizzes([lesson], keywords);

      const quizQuestions = result.questions.filter(
        (q) => q.quizId === 'quiz-lesson-01-01'
      );
      expect(quizQuestions.length).toBeGreaterThanOrEqual(3);
    });

    it('generates 3 questions even with 0 keywords', () => {
      const lesson = makeLesson({ keywords: [] });
      const result = generateQuizzes([lesson], []);

      const quizQuestions = result.questions.filter(
        (q) => q.quizId === 'quiz-lesson-01-01'
      );
      expect(quizQuestions.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('question content in Vietnamese', () => {
    it('definition questions are in Vietnamese', () => {
      const keywords = makeKeywords(3, 'lesson-01-01', 'java-core');
      const lesson = makeLesson({ keywords });
      const result = generateQuizzes([lesson], keywords);

      const defQuestion = result.questions.find((q) =>
        q.questionText.includes('được định nghĩa là gì?')
      );
      expect(defQuestion).toBeDefined();
    });

    it('concept questions are in Vietnamese', () => {
      const keywords = makeKeywords(3, 'lesson-01-01', 'java-core');
      const lesson = makeLesson({ keywords });
      const result = generateQuizzes([lesson], keywords);

      const conceptQuestion = result.questions.find((q) =>
        q.questionText.includes('Điều nào sau đây đúng về')
      );
      expect(conceptQuestion).toBeDefined();
    });
  });

  describe('questionCount matches actual questions', () => {
    it('quiz questionCount matches number of generated questions', () => {
      const keywords = makeKeywords(5, 'lesson-01-01', 'java-core');
      const lesson = makeLesson({ keywords });
      const result = generateQuizzes([lesson], keywords);

      for (const quiz of result.quizzes) {
        const actualCount = result.questions.filter(
          (q) => q.quizId === quiz.id
        ).length;
        expect(quiz.questionCount).toBe(actualCount);
      }
    });
  });
});

// ─── Integration Test: Real Content ───

describe('generateQuizzes with real content', () => {
  const docDir = path.join(process.cwd(), 'doc');
  let content: ReturnType<typeof parseAllContent>;
  let result: QuizGenerationResult;

  beforeAll(() => {
    content = parseAllContent(docDir);
    result = generateQuizzes(content.allLessons, content.allKeywords);
  });

  it('generates one quiz per lesson', () => {
    expect(result.quizzes.length).toBe(content.allLessons.length);
  });

  it('every quiz has at least 3 questions', () => {
    for (const quiz of result.quizzes) {
      const quizQuestions = result.questions.filter(
        (q) => q.quizId === quiz.id
      );
      expect(quizQuestions.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('every question correctAnswer is in optionsJson', () => {
    for (const question of result.questions) {
      expect(question.optionsJson).toContain(question.correctAnswer);
    }
  });

  it('every question has exactly 4 options', () => {
    for (const question of result.questions) {
      expect(question.optionsJson).toHaveLength(4);
    }
  });

  it('quiz IDs follow the expected pattern', () => {
    for (const quiz of result.quizzes) {
      expect(quiz.id).toMatch(/^quiz-lesson-/);
    }
  });

  it('all questions have non-empty questionText', () => {
    for (const question of result.questions) {
      expect(question.questionText.length).toBeGreaterThan(0);
    }
  });

  it('all questions have non-empty explanation', () => {
    for (const question of result.questions) {
      expect(question.explanation.length).toBeGreaterThan(0);
    }
  });

  it('output is deterministic across runs', () => {
    const result2 = generateQuizzes(content.allLessons, content.allKeywords);
    expect(result.quizzes).toEqual(result2.quizzes);
    expect(result.questions).toEqual(result2.questions);
  });
});
