import type { ParsedLesson, ParsedKeyword } from './parse-content';

// ─── Interfaces ───

export interface GeneratedQuiz {
  id: string;           // quiz-{lessonId}
  lessonId: string;
  title: string;        // "Quiz: {lesson title}"
  questionCount: number;
}

export interface GeneratedQuestion {
  id: string;           // question-{quizId}-{orderIndex}
  quizId: string;
  questionText: string;
  questionType: 'multiple_choice';
  optionsJson: string[];  // 4 options
  correctAnswer: string;  // must match one of the options exactly
  explanation: string;
  relatedKeywordId: string | null;
  orderIndex: number;
}

export interface QuizGenerationResult {
  quizzes: GeneratedQuiz[];
  questions: GeneratedQuestion[];
}

// ─── Deterministic Shuffle ───

/**
 * Simple deterministic hash from a string.
 * Returns a positive integer for use as a seed.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

/**
 * Deterministic shuffle of an array using a seed string.
 * Uses Fisher-Yates with a seeded pseudo-random number generator.
 */
function deterministicShuffle<T>(items: readonly T[], seed: string): T[] {
  const result = [...items];
  let h = hashString(seed);

  for (let i = result.length - 1; i > 0; i--) {
    // Simple LCG-style PRNG step
    h = ((h * 1664525 + 1013904223) >>> 0);
    const j = h % (i + 1);
    const temp = result[i];
    result[i] = result[j] as T;
    result[j] = temp as T;
  }

  return result;
}

/**
 * Pick a deterministic item from an array based on a seed.
 */
function deterministicPick<T>(items: readonly T[], seed: string): T {
  const h = hashString(seed);
  return items[h % items.length] as T;
}

// ─── Question Generators ───

/**
 * Extract a short summary from explanation text (first sentence or first 120 chars).
 */
function extractShortExplanation(explanation: string): string {
  if (!explanation) return '';
  // Take first sentence
  const firstSentence = explanation.split(/[.!?]\s/)[0];
  if (firstSentence && firstSentence.length <= 120) {
    return firstSentence + '.';
  }
  return explanation.slice(0, 117) + '...';
}

/**
 * Generate wrong definitions by taking definitions from other keywords.
 * Falls back to generic wrong definitions if not enough keywords available.
 * Returns exactly `count` wrong definitions.
 */
function getWrongDefinitions(
  correctKeyword: ParsedKeyword,
  allKeywordsInModule: readonly ParsedKeyword[],
  count: number,
  seed: string
): string[] {
  const candidates = allKeywordsInModule
    .filter((k) => k.id !== correctKeyword.id && k.definition.length > 0)
    .map((k) => k.definition);

  const shuffled = deterministicShuffle(candidates, seed);
  const result = shuffled.slice(0, count);

  // Fallback generic definitions if not enough from module
  if (result.length < count) {
    const fallbackDefs = [
      'Một cấu trúc dữ liệu dùng để lưu trữ các phần tử theo thứ tự.',
      'Phương thức đặc biệt được gọi khi khởi tạo đối tượng.',
      'Cơ chế cho phép một class kế thừa thuộc tính từ class khác.',
      'Từ khóa dùng để khai báo hằng số không thể thay đổi.',
      'Kiểu dữ liệu dùng để biểu diễn chuỗi ký tự.',
      'Cơ chế xử lý lỗi trong quá trình thực thi chương trình.',
    ].filter((d) => d !== correctKeyword.definition);

    const shuffledFallbacks = deterministicShuffle(fallbackDefs, seed + '-def-fallback');
    for (const fb of shuffledFallbacks) {
      if (result.length >= count) break;
      result.push(fb);
    }
  }

  return result.slice(0, count);
}

/**
 * Generate plausible wrong statements about a keyword.
 * Creates statements that sound reasonable but are incorrect.
 */
function generateWrongStatements(
  keyword: ParsedKeyword,
  allKeywordsInModule: readonly ParsedKeyword[],
  count: number,
  seed: string
): string[] {
  const wrongStatements: string[] = [];

  // Strategy: use explanations from other keywords as wrong statements
  const otherKeywords = allKeywordsInModule
    .filter((k) => k.id !== keyword.id && k.explanation.length > 0);

  const shuffled = deterministicShuffle(otherKeywords, seed);

  for (const other of shuffled) {
    if (wrongStatements.length >= count) break;
    const shortExpl = extractShortExplanation(other.explanation);
    if (shortExpl.length > 0) {
      wrongStatements.push(shortExpl);
    }
  }

  // Fallback: generate generic wrong statements if not enough
  const fallbacks = [
    `${keyword.name} không được sử dụng trong Java hiện đại.`,
    `${keyword.name} chỉ hoạt động trên hệ điều hành Windows.`,
    `${keyword.name} yêu cầu kết nối internet để hoạt động.`,
    `${keyword.name} đã bị loại bỏ từ Java 8 trở đi.`,
    `${keyword.name} không thể sử dụng cùng với các kiểu dữ liệu khác.`,
    `${keyword.name} chỉ áp dụng cho ứng dụng web.`,
  ];

  const shuffledFallbacks = deterministicShuffle(fallbacks, seed + '-fallback');
  for (const fb of shuffledFallbacks) {
    if (wrongStatements.length >= count) break;
    wrongStatements.push(fb);
  }

  return wrongStatements.slice(0, count);
}

/**
 * Generate wrong code output options.
 */
function generateWrongCodeOutputs(
  correctOutput: string,
  seed: string
): string[] {
  const genericWrong = [
    'Compile error',
    'Runtime Exception',
    'NullPointerException',
    'null',
    '0',
    'true',
    'false',
    'Không có output',
    'StackOverflowError',
    'ArrayIndexOutOfBoundsException',
    'ClassCastException',
    'Vòng lặp vô hạn',
    'undefined',
  ];

  const filtered = genericWrong.filter(
    (w) => w.toLowerCase() !== correctOutput.toLowerCase()
  );

  const shuffled = deterministicShuffle(filtered, seed);
  return shuffled.slice(0, 3);
}

// ─── Question Type 1: Definition Match ───

function generateDefinitionQuestion(
  keyword: ParsedKeyword,
  allKeywordsInModule: readonly ParsedKeyword[],
  quizId: string,
  orderIndex: number
): GeneratedQuestion | null {
  if (!keyword.definition || keyword.definition.length === 0) return null;

  const questionId = `question-${quizId}-${orderIndex}`;
  const correctAnswer = keyword.definition;

  const wrongDefs = getWrongDefinitions(
    keyword,
    allKeywordsInModule,
    3,
    questionId
  );

  const allOptions = [correctAnswer, ...wrongDefs.slice(0, 3)];
  const shuffledOptions = deterministicShuffle(allOptions, questionId + '-opts');

  return {
    id: questionId,
    quizId,
    questionText: `${keyword.name} được định nghĩa là gì?`,
    questionType: 'multiple_choice',
    optionsJson: shuffledOptions,
    correctAnswer,
    explanation: `${keyword.name}: ${keyword.definition}. ${extractShortExplanation(keyword.explanation)}`,
    relatedKeywordId: keyword.id,
    orderIndex,
  };
}

// ─── Question Type 2: Concept Understanding ───

function generateConceptQuestion(
  keyword: ParsedKeyword,
  allKeywordsInModule: readonly ParsedKeyword[],
  quizId: string,
  orderIndex: number
): GeneratedQuestion | null {
  if (!keyword.explanation || keyword.explanation.length === 0) return null;

  const questionId = `question-${quizId}-${orderIndex}`;
  const correctAnswer = extractShortExplanation(keyword.explanation);

  if (correctAnswer.length === 0) return null;

  const wrongStatements = generateWrongStatements(
    keyword,
    allKeywordsInModule,
    3,
    questionId
  );

  if (wrongStatements.length < 3) return null;

  const allOptions = [correctAnswer, ...wrongStatements.slice(0, 3)];
  const shuffledOptions = deterministicShuffle(allOptions, questionId + '-opts');

  return {
    id: questionId,
    quizId,
    questionText: `Điều nào sau đây đúng về ${keyword.name}?`,
    questionType: 'multiple_choice',
    optionsJson: shuffledOptions,
    correctAnswer,
    explanation: `${keyword.name}: ${keyword.explanation.slice(0, 200)}`,
    relatedKeywordId: keyword.id,
    orderIndex,
  };
}

// ─── Question Type 3: Code Output/Behavior ───

function generateCodeQuestion(
  keyword: ParsedKeyword,
  allKeywordsInModule: readonly ParsedKeyword[],
  quizId: string,
  orderIndex: number
): GeneratedQuestion | null {
  if (!keyword.codeExample || keyword.codeExample.length === 0) return null;

  const questionId = `question-${quizId}-${orderIndex}`;

  // Extract a meaningful code snippet (first few lines)
  const codeLines = keyword.codeExample.split('\n').filter((l) => l.trim().length > 0);
  const snippet = codeLines.slice(0, 5).join('\n');

  if (snippet.length === 0) return null;

  // The correct answer describes what the code does
  const correctAnswer = `Code minh họa cách sử dụng ${keyword.name} trong Java.`;

  const wrongOutputs = generateWrongCodeOutputs(correctAnswer, questionId);

  // If we can't get 3 wrong outputs, use concept-based wrongs
  if (wrongOutputs.length < 3) return null;

  const allOptions = [correctAnswer, ...wrongOutputs];
  const shuffledOptions = deterministicShuffle(allOptions, questionId + '-opts');

  return {
    id: questionId,
    quizId,
    questionText: `Đoạn code sau liên quan đến khái niệm nào?\n\n\`\`\`java\n${snippet}\n\`\`\``,
    questionType: 'multiple_choice',
    optionsJson: shuffledOptions,
    correctAnswer,
    explanation: `Đoạn code trên minh họa ${keyword.name}. ${extractShortExplanation(keyword.explanation)}`,
    relatedKeywordId: keyword.id,
    orderIndex,
  };
}

// ─── Fallback Questions ───

function generateCategoryQuestion(
  keyword: ParsedKeyword,
  allKeywordsInModule: readonly ParsedKeyword[],
  quizId: string,
  orderIndex: number
): GeneratedQuestion | null {
  const questionId = `question-${quizId}-${orderIndex}`;

  const correctAnswer = keyword.name;

  // Get keywords from other categories as wrong answers
  const otherNames = allKeywordsInModule
    .filter((k) => k.id !== keyword.id)
    .map((k) => k.name);

  if (otherNames.length < 3) {
    // Not enough keywords for wrong answers — use generic terms
    const genericTerms = [
      'HashMap', 'ArrayList', 'Thread', 'Socket',
      'Servlet', 'JDBC', 'JUnit', 'Maven',
      'Gradle', 'Docker', 'Kubernetes', 'REST',
    ].filter((t) => t !== keyword.name);

    const shuffledGeneric = deterministicShuffle(genericTerms, questionId);
    const wrongAnswers = shuffledGeneric.slice(0, 3);

    const allOptions = [correctAnswer, ...wrongAnswers];
    const shuffledOptions = deterministicShuffle(allOptions, questionId + '-opts');

    return {
      id: questionId,
      quizId,
      questionText: `Keyword nào thuộc về chủ đề "${keyword.category}"?`,
      questionType: 'multiple_choice',
      optionsJson: shuffledOptions,
      correctAnswer,
      explanation: `${keyword.name} thuộc về category "${keyword.category}". ${keyword.definition}`,
      relatedKeywordId: keyword.id,
      orderIndex,
    };
  }

  const shuffledOthers = deterministicShuffle(otherNames, questionId);
  const wrongAnswers = shuffledOthers.slice(0, 3);

  const allOptions = [correctAnswer, ...wrongAnswers];
  const shuffledOptions = deterministicShuffle(allOptions, questionId + '-opts');

  return {
    id: questionId,
    quizId,
    questionText: `Keyword nào thuộc về chủ đề "${keyword.category}"?`,
    questionType: 'multiple_choice',
    optionsJson: shuffledOptions,
    correctAnswer,
    explanation: `${keyword.name} thuộc về category "${keyword.category}". ${keyword.definition}`,
    relatedKeywordId: keyword.id,
    orderIndex,
  };
}

function generateTrueFalseStyleQuestion(
  keyword: ParsedKeyword,
  quizId: string,
  orderIndex: number
): GeneratedQuestion {
  const questionId = `question-${quizId}-${orderIndex}`;

  const correctAnswer = `Đúng — ${keyword.name} là một khái niệm trong ${keyword.category}.`;

  const wrongAnswers = [
    `Sai — ${keyword.name} không tồn tại trong Java.`,
    `Sai — ${keyword.name} chỉ có trong Python, không có trong Java.`,
    `Sai — ${keyword.name} đã bị deprecated và không nên sử dụng.`,
  ];

  const allOptions = [correctAnswer, ...wrongAnswers];
  const shuffledOptions = deterministicShuffle(allOptions, questionId + '-opts');

  return {
    id: questionId,
    quizId,
    questionText: `"${keyword.name}" có phải là một khái niệm hợp lệ trong ${keyword.category} không?`,
    questionType: 'multiple_choice',
    optionsJson: shuffledOptions,
    correctAnswer,
    explanation: `${keyword.name}: ${keyword.definition}`,
    relatedKeywordId: keyword.id,
    orderIndex,
  };
}

// ─── Fallback for lessons with no keywords ───

function generateLessonTopicQuestion(
  lesson: ParsedLesson,
  quizId: string,
  orderIndex: number
): GeneratedQuestion {
  const questionId = `question-${quizId}-${orderIndex}`;

  const correctAnswer = lesson.description || lesson.title;

  const wrongAnswers = [
    'Bài học này nói về cách cài đặt hệ điều hành Linux.',
    'Bài học này hướng dẫn thiết kế giao diện người dùng với CSS.',
    'Bài học này giới thiệu về machine learning và AI.',
  ];

  const allOptions = [correctAnswer, ...wrongAnswers];
  const shuffledOptions = deterministicShuffle(allOptions, questionId + '-opts');

  return {
    id: questionId,
    quizId,
    questionText: `Nội dung chính của bài học "${lesson.titleVi}" là gì?`,
    questionType: 'multiple_choice',
    optionsJson: shuffledOptions,
    correctAnswer,
    explanation: `Bài học "${lesson.titleVi}" (${lesson.title}) tập trung vào: ${correctAnswer}`,
    relatedKeywordId: null,
    orderIndex,
  };
}

// ─── Main Quiz Generation ───

/**
 * Generate quizzes and questions for all lessons.
 * Deterministic: same input always produces same output.
 *
 * @param lessons - All parsed lessons
 * @param allKeywords - All parsed keywords across all lessons
 * @returns Generated quizzes and questions
 */
export function generateQuizzes(
  lessons: readonly ParsedLesson[],
  allKeywords: readonly ParsedKeyword[]
): QuizGenerationResult {
  const quizzes: GeneratedQuiz[] = [];
  const questions: GeneratedQuestion[] = [];

  // Group keywords by module for cross-keyword question generation
  const keywordsByModule = new Map<string, ParsedKeyword[]>();
  for (const keyword of allKeywords) {
    // Find the lesson to get moduleId
    const lesson = lessons.find((l) => l.id === keyword.lessonId);
    if (!lesson) continue;
    const moduleId = lesson.moduleId;
    const existing = keywordsByModule.get(moduleId);
    if (existing) {
      existing.push(keyword);
    } else {
      keywordsByModule.set(moduleId, [keyword]);
    }
  }

  for (const lesson of lessons) {
    const quizId = `quiz-${lesson.id}`;
    const lessonKeywords = lesson.keywords;
    const moduleKeywords = keywordsByModule.get(lesson.moduleId) ?? [];

    const generatedQuestions: GeneratedQuestion[] = [];
    let orderIndex = 0;

    if (lessonKeywords.length >= 3) {
      // Enough keywords — generate one question per type for first 3+ keywords
      for (const keyword of lessonKeywords) {
        // Cycle through question types based on keyword index
        const keywordIndex = lessonKeywords.indexOf(keyword);
        const questionType = keywordIndex % 3;

        let question: GeneratedQuestion | null = null;

        if (questionType === 0) {
          question = generateDefinitionQuestion(keyword, moduleKeywords, quizId, orderIndex);
        } else if (questionType === 1) {
          question = generateConceptQuestion(keyword, moduleKeywords, quizId, orderIndex);
        } else {
          question = generateCodeQuestion(keyword, moduleKeywords, quizId, orderIndex);
          // Fallback to concept question if no code example
          if (!question) {
            question = generateConceptQuestion(keyword, moduleKeywords, quizId, orderIndex);
          }
        }

        // Fallback to definition question if other types fail
        if (!question) {
          question = generateDefinitionQuestion(keyword, moduleKeywords, quizId, orderIndex);
        }

        // Last resort fallback
        if (!question) {
          question = generateTrueFalseStyleQuestion(keyword, quizId, orderIndex);
        }

        generatedQuestions.push(question);
        orderIndex++;
      }
    } else if (lessonKeywords.length > 0) {
      // Fewer than 3 keywords — generate what we can, then fill with fallbacks
      for (const keyword of lessonKeywords) {
        const question = generateDefinitionQuestion(keyword, moduleKeywords, quizId, orderIndex)
          ?? generateConceptQuestion(keyword, moduleKeywords, quizId, orderIndex)
          ?? generateTrueFalseStyleQuestion(keyword, quizId, orderIndex);

        generatedQuestions.push(question);
        orderIndex++;
      }

      // Fill remaining with fallback questions
      while (generatedQuestions.length < 3) {
        if (lessonKeywords.length > 0) {
          // Use category or true/false questions for existing keywords
          const keywordIdx = generatedQuestions.length % lessonKeywords.length;
          const keyword = lessonKeywords[keywordIdx] as ParsedKeyword;

          if (generatedQuestions.length % 2 === 0) {
            const catQ = generateCategoryQuestion(keyword, moduleKeywords, quizId, orderIndex);
            if (catQ) {
              generatedQuestions.push(catQ);
            } else {
              generatedQuestions.push(
                generateTrueFalseStyleQuestion(keyword, quizId, orderIndex)
              );
            }
          } else {
            generatedQuestions.push(
              generateTrueFalseStyleQuestion(keyword, quizId, orderIndex)
            );
          }
        } else {
          generatedQuestions.push(
            generateLessonTopicQuestion(lesson, quizId, orderIndex)
          );
        }
        orderIndex++;
      }
    } else {
      // No keywords at all — generate topic-based questions
      for (let i = 0; i < 3; i++) {
        generatedQuestions.push(
          generateLessonTopicQuestion(lesson, quizId, orderIndex)
        );
        orderIndex++;
      }
    }

    const quiz: GeneratedQuiz = {
      id: quizId,
      lessonId: lesson.id,
      title: `Quiz: ${lesson.titleVi}`,
      questionCount: generatedQuestions.length,
    };

    quizzes.push(quiz);
    questions.push(...generatedQuestions);
  }

  return { quizzes, questions };
}

// ─── Standalone Execution ───

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { parseAllContent } = require('./parse-content') as typeof import('./parse-content');

  console.log('🧠 Generating quizzes from parsed content...\n');

  const content = parseAllContent();
  const result = generateQuizzes(content.allLessons, content.allKeywords);

  console.log(`📝 Quizzes: ${result.quizzes.length}`);
  console.log(`❓ Questions: ${result.questions.length}`);
  console.log('');

  for (const quiz of result.quizzes) {
    const quizQuestions = result.questions.filter((q) => q.quizId === quiz.id);
    console.log(`  ${quiz.id} — ${quiz.title} (${quizQuestions.length} questions)`);
    for (const q of quizQuestions) {
      console.log(`    ${q.id}: ${q.questionText.slice(0, 60)}...`);
    }
  }

  // Validate: every quiz has at least 3 questions
  const underQuizzes = result.quizzes.filter((quiz) => {
    const count = result.questions.filter((q) => q.quizId === quiz.id).length;
    return count < 3;
  });

  if (underQuizzes.length > 0) {
    console.warn('\n⚠️  Quizzes with fewer than 3 questions:');
    for (const q of underQuizzes) {
      console.warn(`    ${q.id}: ${q.questionCount} questions`);
    }
  }

  // Validate: correctAnswer matches one of the options
  const mismatchedAnswers = result.questions.filter(
    (q) => !q.optionsJson.includes(q.correctAnswer)
  );

  if (mismatchedAnswers.length > 0) {
    console.warn('\n⚠️  Questions where correctAnswer does not match any option:');
    for (const q of mismatchedAnswers) {
      console.warn(`    ${q.id}: "${q.correctAnswer}"`);
    }
  }

  console.log('\n✅ Quiz generation complete.');
}
