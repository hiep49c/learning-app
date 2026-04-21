import {
  modelClasses,
  UserProfile,
  Module,
  ModulePrerequisite,
  Lesson,
  Keyword,
  KeywordRelation,
  CodeExample,
  Quiz,
  QuizQuestion,
  LessonProgress,
  QuizAttempt,
  Bookmark,
} from '../models';

describe('WatermelonDB Model classes', () => {
  it('exports modelClasses array with all 12 models', () => {
    expect(modelClasses).toHaveLength(12);
  });

  it('exports all model classes individually', () => {
    expect(UserProfile).toBeDefined();
    expect(Module).toBeDefined();
    expect(ModulePrerequisite).toBeDefined();
    expect(Lesson).toBeDefined();
    expect(Keyword).toBeDefined();
    expect(KeywordRelation).toBeDefined();
    expect(CodeExample).toBeDefined();
    expect(Quiz).toBeDefined();
    expect(QuizQuestion).toBeDefined();
    expect(LessonProgress).toBeDefined();
    expect(QuizAttempt).toBeDefined();
    expect(Bookmark).toBeDefined();
  });

  it('modelClasses contains all exported model classes', () => {
    const expectedClasses = [
      UserProfile,
      Module,
      ModulePrerequisite,
      Lesson,
      Keyword,
      KeywordRelation,
      CodeExample,
      Quiz,
      QuizQuestion,
      LessonProgress,
      QuizAttempt,
      Bookmark,
    ];
    expectedClasses.forEach((cls) => {
      expect(modelClasses).toContain(cls);
    });
  });

  describe('static table names match schema', () => {
    const expectedTables: [typeof UserProfile | typeof Module | typeof ModulePrerequisite | typeof Lesson | typeof Keyword | typeof KeywordRelation | typeof CodeExample | typeof Quiz | typeof QuizQuestion | typeof LessonProgress | typeof QuizAttempt | typeof Bookmark, string][] = [
      [UserProfile, 'user_profiles'],
      [Module, 'modules'],
      [ModulePrerequisite, 'module_prerequisites'],
      [Lesson, 'lessons'],
      [Keyword, 'keywords'],
      [KeywordRelation, 'keyword_relations'],
      [CodeExample, 'code_examples'],
      [Quiz, 'quizzes'],
      [QuizQuestion, 'quiz_questions'],
      [LessonProgress, 'lesson_progress'],
      [QuizAttempt, 'quiz_attempts'],
      [Bookmark, 'bookmarks'],
    ];

    it.each(expectedTables)('%p has table name %s', (ModelClass, tableName) => {
      expect(ModelClass.table).toBe(tableName);
    });
  });

  describe('static associations are defined', () => {
    it('UserProfile has has_many associations for progress, attempts, bookmarks', () => {
      const assoc = UserProfile.associations;
      expect(assoc.lesson_progress).toEqual({ type: 'has_many', foreignKey: 'user_id' });
      expect(assoc.quiz_attempts).toEqual({ type: 'has_many', foreignKey: 'user_id' });
      expect(assoc.bookmarks).toEqual({ type: 'has_many', foreignKey: 'user_id' });
    });

    it('Module has has_many associations for lessons and prerequisites', () => {
      const assoc = Module.associations;
      expect(assoc.lessons).toEqual({ type: 'has_many', foreignKey: 'module_id' });
      expect(assoc.module_prerequisites).toEqual({ type: 'has_many', foreignKey: 'module_id' });
    });

    it('ModulePrerequisite belongs_to modules', () => {
      const assoc = ModulePrerequisite.associations;
      expect(assoc.modules).toEqual({ type: 'belongs_to', key: 'module_id' });
    });

    it('Lesson belongs_to modules and has_many children', () => {
      const assoc = Lesson.associations;
      expect(assoc.modules).toEqual({ type: 'belongs_to', key: 'module_id' });
      expect(assoc.keywords).toEqual({ type: 'has_many', foreignKey: 'lesson_id' });
      expect(assoc.code_examples).toEqual({ type: 'has_many', foreignKey: 'lesson_id' });
      expect(assoc.quizzes).toEqual({ type: 'has_many', foreignKey: 'lesson_id' });
      expect(assoc.lesson_progress).toEqual({ type: 'has_many', foreignKey: 'lesson_id' });
    });

    it('Keyword belongs_to lessons and has_many keyword_relations', () => {
      const assoc = Keyword.associations;
      expect(assoc.lessons).toEqual({ type: 'belongs_to', key: 'lesson_id' });
      expect(assoc.keyword_relations).toEqual({ type: 'has_many', foreignKey: 'keyword_id' });
    });

    it('KeywordRelation belongs_to keywords', () => {
      const assoc = KeywordRelation.associations;
      expect(assoc.keywords).toEqual({ type: 'belongs_to', key: 'keyword_id' });
    });

    it('CodeExample belongs_to lessons', () => {
      const assoc = CodeExample.associations;
      expect(assoc.lessons).toEqual({ type: 'belongs_to', key: 'lesson_id' });
    });

    it('Quiz belongs_to lessons and has_many quiz_questions', () => {
      const assoc = Quiz.associations;
      expect(assoc.lessons).toEqual({ type: 'belongs_to', key: 'lesson_id' });
      expect(assoc.quiz_questions).toEqual({ type: 'has_many', foreignKey: 'quiz_id' });
    });

    it('QuizQuestion belongs_to quizzes', () => {
      const assoc = QuizQuestion.associations;
      expect(assoc.quizzes).toEqual({ type: 'belongs_to', key: 'quiz_id' });
    });

    it('LessonProgress belongs_to user_profiles and lessons', () => {
      const assoc = LessonProgress.associations;
      expect(assoc.user_profiles).toEqual({ type: 'belongs_to', key: 'user_id' });
      expect(assoc.lessons).toEqual({ type: 'belongs_to', key: 'lesson_id' });
    });

    it('QuizAttempt belongs_to user_profiles and quizzes', () => {
      const assoc = QuizAttempt.associations;
      expect(assoc.user_profiles).toEqual({ type: 'belongs_to', key: 'user_id' });
      expect(assoc.quizzes).toEqual({ type: 'belongs_to', key: 'quiz_id' });
    });

    it('Bookmark belongs_to user_profiles', () => {
      const assoc = Bookmark.associations;
      expect(assoc.user_profiles).toEqual({ type: 'belongs_to', key: 'user_id' });
    });
  });
});
