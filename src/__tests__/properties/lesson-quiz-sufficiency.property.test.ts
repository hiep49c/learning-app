/**
 * Property 11: Every lesson has a quiz with sufficient questions
 *
 * For any lesson in the database, there SHALL exist at least one quiz
 * associated with that lesson, and that quiz SHALL contain at least 3 questions.
 *
 * Feature: java-spring-course-package, Property 11: Every lesson has a quiz with sufficient questions
 *
 * **Validates: Requirements 15.1**
 */
import fc from 'fast-check';

interface SeedLesson {
  id: string;
  module_id: string;
  title: string;
  title_vi: string;
  description: string;
  order_index: number;
  content_json: string;
  source_file: string;
  estimated_minutes: number;
}

interface SeedQuiz {
  id: string;
  lesson_id: string;
  title: string;
  question_count: number;
}

interface SeedQuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  options_json: string;
  correct_answer: string;
  explanation: string;
  related_keyword_id: string | null;
  order_index: number;
}

// Load seed data once
const seedLessons: SeedLesson[] = require('../../../assets/seed-data/lessons.json');
const seedQuizzes: SeedQuiz[] = require('../../../assets/seed-data/quizzes.json');
const seedQuizQuestions: SeedQuizQuestion[] = require('../../../assets/seed-data/quiz_questions.json');

// Build lookup maps for fast access
const quizzesByLessonId = new Map<string, SeedQuiz[]>();
for (const quiz of seedQuizzes) {
  const existing = quizzesByLessonId.get(quiz.lesson_id) ?? [];
  existing.push(quiz);
  quizzesByLessonId.set(quiz.lesson_id, existing);
}

const questionsByQuizId = new Map<string, SeedQuizQuestion[]>();
for (const question of seedQuizQuestions) {
  const existing = questionsByQuizId.get(question.quiz_id) ?? [];
  existing.push(question);
  questionsByQuizId.set(question.quiz_id, existing);
}

describe('Feature: java-spring-course-package, Property 11: Every lesson has a quiz with sufficient questions', () => {
  it('Property 11: every lesson has at least one quiz with ≥ 3 questions', () => {
    // Build an arbitrary that picks any lesson from the seed data
    const lessonArb = fc.constantFrom(...seedLessons);

    fc.assert(
      fc.property(lessonArb, (lesson: SeedLesson) => {
        // Verify at least one quiz exists for this lesson
        const quizzes = quizzesByLessonId.get(lesson.id);
        expect(quizzes).toBeDefined();
        expect(Array.isArray(quizzes)).toBe(true);
        expect(quizzes!.length).toBeGreaterThanOrEqual(1);

        // Verify at least one quiz has ≥ 3 questions
        const hasQuizWithSufficientQuestions = quizzes!.some((quiz) => {
          const questions = questionsByQuizId.get(quiz.id) ?? [];
          return questions.length >= 3;
        });

        expect(hasQuizWithSufficientQuestions).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
