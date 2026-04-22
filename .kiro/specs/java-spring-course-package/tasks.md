# Implementation Plan: Java Spring Course Package

## Overview

Build a local-first mobile learning app for Java Spring using React Native + Expo, TypeScript strict, WatermelonDB, Zustand + immer, and Expo Router. The implementation follows a bottom-up approach: project setup → data layer → content pipeline → service layer → state management → UI screens → testing → APK build. All content is parsed from markdown at build time and seeded into WatermelonDB at first launch.

## Tasks

- [x] 1. Project setup and core infrastructure
  - [x] 1.1 Initialize Expo project with TypeScript strict and install core dependencies
    - Create Expo project with `expo-router`, `react-native-paper`, `zustand`, `immer`, `@nozbe/watermelondb`, `@react-native-async-storage/async-storage`
    - Configure `tsconfig.json` with strict mode enabled
    - Install dev dependencies: `jest`, `fast-check`, `@testing-library/react-native`
    - Set up path aliases in `tsconfig.json` for `@/` prefix
    - _Requirements: 1.5, 17.1, 17.4_

  - [x] 1.2 Set up Expo Router navigation structure
    - Create `app/_layout.tsx` (Root layout with DatabaseProvider, ThemeProvider)
    - Create `app/(auth)/_layout.tsx` and `app/(auth)/login.tsx`
    - Create `app/(tabs)/_layout.tsx` with bottom tab navigator (Home, Course, Search, Bookmarks, Profile)
    - Create `app/(tabs)/index.tsx`, `app/(tabs)/search.tsx`, `app/(tabs)/bookmarks.tsx`, `app/(tabs)/profile.tsx`
    - Create `app/(tabs)/course/_layout.tsx`, `app/(tabs)/course/index.tsx`, `app/(tabs)/course/[lessonId].tsx`
    - Create `app/quiz/[quizId].tsx` and `app/quiz/result/[attemptId].tsx`
    - Create `app/keyword/[keywordId].tsx`
    - _Requirements: 1.1, 1.3_

  - [x] 1.3 Configure React Native Paper theme with Vietnamese locale support
    - Set up light/dark theme with `react-native-paper` Provider
    - Configure font families (monospace for code, system for UI)
    - Set up safe area handling for Samsung S24 Ultra (6.8" QHD+)
    - _Requirements: 16.3_

- [x] 2. WatermelonDB data layer
  - [x] 2.1 Define WatermelonDB schema with all 12 tables
    - Create `src/database/schema.ts` with tables: `user_profiles`, `modules`, `module_prerequisites`, `lessons`, `keywords`, `keyword_relations`, `code_examples`, `quizzes`, `quiz_questions`, `lesson_progress`, `quiz_attempts`, `bookmarks`
    - Define all columns with correct types, indexes, and optional fields as specified in design
    - _Requirements: 1.5, 17.1_

  - [x] 2.2 Create WatermelonDB Model classes for all 12 tables
    - Create `src/database/models/` directory with model files: `UserProfile.ts`, `Module.ts`, `ModulePrerequisite.ts`, `Lesson.ts`, `Keyword.ts`, `KeywordRelation.ts`, `CodeExample.ts`, `Quiz.ts`, `QuizQuestion.ts`, `LessonProgress.ts`, `QuizAttempt.ts`, `Bookmark.ts`
    - Define associations (e.g., Module has many Lessons, Lesson has many Keywords)
    - Export `modelClasses` array for database initialization
    - _Requirements: 1.4, 1.5_

  - [x] 2.3 Set up DatabaseProvider with WatermelonDB initialization
    - Create `src/database/index.ts` with database adapter setup (SQLiteAdapter)
    - Create `src/database/DatabaseProvider.tsx` React context provider
    - Wire DatabaseProvider into `app/_layout.tsx`
    - _Requirements: 17.1, 17.5_

- [x] 3. Build-time content pipeline (markdown → JSON seed data)
  - [x] 3.1 Create markdown parser script (`scripts/parse-content.ts`)
    - Parse all `doc/**/*.md` files into structured JSON
    - Extract modules from directory structure (folder name → module)
    - Extract lessons from individual `.md` files
    - Extract keywords from `## Keyword: <name>` headings
    - Extract code examples from fenced code blocks with language tags
    - Generate `LessonContent` JSON structure with sections: heading, paragraph, code_block, table, list, keyword_ref
    - _Requirements: 18.1, 18.2_

  - [x] 3.2 Generate quiz data from lesson content
    - Create quiz generation logic in `scripts/generate-quizzes.ts`
    - Generate at least 3 multiple-choice questions per lesson based on keywords and concepts
    - Include `correct_answer`, `explanation`, and `related_keyword_id` for each question
    - _Requirements: 15.1_

  - [x] 3.3 Output seed data JSON files
    - Write seed data to `assets/seed-data/modules.json`, `lessons.json`, `keywords.json`, `keyword_relations.json`, `code_examples.json`, `quizzes.json`, `quiz_questions.json`
    - Include `module_prerequisites.json` defining prerequisite relationships between modules
    - Add npm script `parse-content` to `package.json` to run the pipeline
    - Validate output: every lesson has ≥1 code block, every keyword has definition ≤100 chars
    - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 10.1, 10.2, 10.3, 11.1, 11.3, 18.2_

- [x] 4. Checkpoint — Verify content pipeline
  - Run `npm run parse-content` and verify JSON output is valid
  - Verify all 9 modules, 27 lessons, keywords, and quizzes are generated
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Seed service and first-launch data loading
  - [x] 5.1 Implement SeedService
    - Create `src/services/SeedService.ts` implementing `isSeeded()`, `getSeedVersion()`, `seed()`, `resumeSeed()`
    - Load JSON from bundled `assets/seed-data/*.json`
    - Seed in batches per module for resumability
    - Track progress via `@seed_version` and `@seed_last_module` in AsyncStorage
    - Implement progress callback `onProgress(percent)` for UI feedback
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ]* 5.2 Write property test for seed resume idempotency (Property 14)
    - **Property 14: Seed resume idempotency**
    - Simulate interruption at random module K of N, resume seed, verify final DB state matches complete uninterrupted seed — no duplicates, no missing records
    - **Validates: Requirements 18.4**

  - [x] 5.3 Create SeedingScreen with progress indicator
    - Create `src/components/SeedingScreen.tsx` showing progress bar during first-launch seeding
    - Integrate into `app/_layout.tsx` — show SeedingScreen until seeding completes
    - _Requirements: 18.3_

- [x] 6. Service layer implementation
  - [x] 6.1 Implement ProgressService
    - Create `src/services/ProgressService.ts`
    - Implement `markLessonComplete(lessonId, timeSpent)` — write to `lesson_progress` table
    - Implement `updateScrollPosition(lessonId, position)` — update scroll position in `lesson_progress`
    - Implement `getNextLesson()` — return first uncompleted lesson by module order then lesson order
    - Implement `getModuleCompletion(moduleId)` — return `Math.round((completed / total) * 100)`
    - Implement `getOverallCompletion()` — same formula across all lessons
    - Store `@last_lesson_id` in AsyncStorage
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ]* 6.2 Write property tests for ProgressService
    - [ ]* 6.2.1 Property test: Progress completion percentage (Property 5)
      - **Property 5: Progress completion percentage calculation**
      - For any (total, completed) pair where 0 ≤ completed ≤ total, verify `Math.round((completed / total) * 100)` matches service output
      - **Validates: Requirements 12.2, 12.3**
    - [ ]* 6.2.2 Property test: Next lesson ordering (Property 6)
      - **Property 6: Next lesson is first uncompleted in order**
      - For any set of completed lessons, verify `getNextLesson()` returns the first uncompleted lesson by (module order, lesson order), or null if all complete
      - **Validates: Requirements 12.4**
    - [ ]* 6.2.3 Property test: Progress mark-complete round-trip (Property 15)
      - **Property 15: Progress mark-complete round-trip**
      - For any lesson and timeSpent value, marking complete then reading back returns `is_completed: true`, valid `completed_at`, and same `time_spent_seconds`
      - **Validates: Requirements 12.1**

  - [x] 6.3 Implement SearchService
    - Create `src/services/SearchService.ts`
    - Implement `searchAll(query)` — search across lessons (title), keywords (name, definition), code examples (description)
    - Use WatermelonDB `Q.where` with `Q.like` for text matching
    - Support Vietnamese and English search terms
    - Group results by type: `{ lessons, keywords, codeExamples }`
    - Implement `getSuggestions(query)` for autocomplete
    - Target: results within 500ms
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ]* 6.4 Write property tests for SearchService
    - [ ]* 6.4.1 Property test: Keyword search returns matching results (Property 4)
      - **Property 4: Keyword search returns matching results**
      - For any keyword whose name is used as search query, verify the keyword appears in results
      - **Validates: Requirements 11.2**
    - [ ]* 6.4.2 Property test: Search returns grouped results (Property 7)
      - **Property 7: Search returns grouped results across all content types**
      - For any query matching content in all three types, verify `SearchResults` has separate non-empty arrays for each type
      - **Validates: Requirements 13.1, 13.3**

  - [x] 6.5 Implement QuizEvaluationService
    - Create `src/services/QuizEvaluationService.ts`
    - Implement `evaluateAnswer(question, userAnswer)` — compare answer, return `AnswerResult` with `isCorrect`, `correctAnswer`, `explanation`, `relatedLessonId`
    - Implement `calculateScore(results)` — compute score from answer results
    - _Requirements: 15.2, 15.3_

  - [ ]* 6.6 Write property test for wrong answer evaluation (Property 13)
    - **Property 13: Wrong answer evaluation returns explanation**
    - For any quiz question and any user answer ≠ correct_answer, verify `evaluateAnswer()` returns `isCorrect: false`, the `correctAnswer`, non-empty `explanation`, and valid `relatedLessonId`
    - **Validates: Requirements 15.3**

  - [x] 6.7 Implement BookmarkService
    - Create `src/services/BookmarkService.ts`
    - Implement `toggleBookmark(itemId, itemType)` — create or delete bookmark
    - Implement `updateNote(bookmarkId, note)` — update bookmark note (max 500 chars)
    - Implement `deleteBookmark(bookmarkId)` — remove bookmark from DB
    - Implement `getBookmarks(filter?)` — query bookmarks sorted by `created_at` descending
    - Implement `isBookmarked(itemId)` — check if item is bookmarked
    - _Requirements: 14.1, 14.2, 14.3_

  - [ ]* 6.8 Write property tests for BookmarkService
    - [ ]* 6.8.1 Property test: Bookmark persistence round-trip (Property 8)
      - **Property 8: Bookmark persistence round-trip**
      - For any lesson or keyword, creating a bookmark then querying returns bookmark with same `item_id`, `item_type`, and valid `created_at`
      - **Validates: Requirements 14.1**
    - [ ]* 6.8.2 Property test: Bookmarks sorted by creation time (Property 9)
      - **Property 9: Bookmarks sorted by creation time**
      - For any set of bookmarks with distinct `created_at`, querying returns them sorted descending (newest first)
      - **Validates: Requirements 14.2**
    - [ ]* 6.8.3 Property test: Bookmark deletion (Property 10)
      - **Property 10: Bookmark deletion**
      - For any existing bookmark, after `deleteBookmark()`, querying by ID returns no results
      - **Validates: Requirements 14.3**

  - [x] 6.9 Implement module prerequisite unlock logic
    - Create `src/services/ModuleUnlockService.ts`
    - Implement `isModuleUnlocked(moduleId, completedModuleIds)` — return true iff all prerequisites are in completed set (or module has no prerequisites)
    - Query `module_prerequisites` table for prerequisite relationships
    - _Requirements: 1.3, 2.4_

  - [ ]* 6.10 Write property test for module unlock logic (Property 1)
    - **Property 1: Module prerequisite unlock logic**
    - For any module and any set of completed modules, verify `isModuleUnlocked()` returns true iff every prerequisite is in the completed set
    - **Validates: Requirements 1.3, 2.4**

- [x] 7. Checkpoint — Verify services and property tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Zustand stores
  - [x] 8.1 Implement AuthStore
    - Create `src/stores/authStore.ts` using Zustand with immer middleware
    - Implement `login(profileId, pin?)`, `logout()`, `createProfile(name, pin?)`, `deleteProfile(profileId)`
    - PIN hashing with a lightweight hash (no bcrypt in RN — use `expo-crypto` SHA-256)
    - Persist `@current_user_id` in AsyncStorage
    - _Requirements: 1.3_

  - [x] 8.2 Implement ProgressStore
    - Create `src/stores/progressStore.ts` using Zustand with immer
    - State: `lessonProgress`, `moduleProgress`, `overallProgress`, `lastLessonId`, `lastScrollPosition`
    - Actions delegate to ProgressService: `markLessonComplete`, `updateScrollPosition`, `getNextLesson`, `getModuleCompletion`
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 8.3 Implement CourseStore
    - Create `src/stores/courseStore.ts` using Zustand with immer
    - State: `modules`, `expandedModules`, `selectedLessonId`, `isLoading`
    - Actions: `loadCourseTree()`, `toggleModule()`, `selectLesson()`, `isModuleUnlocked()` (delegates to ModuleUnlockService)
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 8.4 Implement SearchStore
    - Create `src/stores/searchStore.ts` using Zustand with immer
    - State: `query`, `results`, `isSearching`, `recentSearches`
    - Actions delegate to SearchService: `search()`, `clearSearch()`, `addRecentSearch()`
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 8.5 Implement QuizStore
    - Create `src/stores/quizStore.ts` using Zustand with immer
    - State: `currentQuiz`, `currentQuestionIndex`, `answers`, `isSubmitted`, `score`
    - Actions: `loadQuiz()`, `answerQuestion()`, `submitQuiz()`, `resetQuiz()`, `nextQuestion()`, `previousQuestion()`
    - Save quiz attempts to `quiz_attempts` table via WatermelonDB
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [ ]* 8.6 Write property test for quiz attempt preservation (Property 12)
    - **Property 12: All quiz attempts are preserved**
    - For any quiz and N submissions (N ≥ 1), after submitting N times, verify `quiz_attempts` contains exactly N records with correct `quiz_id`, `score`, `answers_json`, `completed_at`
    - **Validates: Requirements 15.2, 15.4**

  - [x] 8.7 Implement BookmarkStore
    - Create `src/stores/bookmarkStore.ts` using Zustand with immer
    - State: `bookmarks`, `filterModule`, `filterType`
    - Actions delegate to BookmarkService: `toggleBookmark()`, `updateNote()`, `deleteBookmark()`, `isBookmarked()`, `setFilter()`
    - _Requirements: 14.1, 14.2, 14.3_

- [x] 9. Checkpoint — Verify stores integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Core UI components
  - [x] 10.1 Implement CodeBlock component
    - Create `src/components/CodeBlock.tsx`
    - Syntax highlighting for Java (and xml, yaml, etc.)
    - Show line numbers, file name header, horizontal scroll for long lines
    - Copy-to-clipboard button using `expo-clipboard`
    - Monospace font styling
    - _Requirements: 16.1, 16.2, 16.3_

  - [x] 10.2 Implement ContentRenderer component
    - Create `src/components/ContentRenderer.tsx`
    - Parse `LessonContent` JSON and render sections: headings, paragraphs, code blocks (via CodeBlock), tables, lists, keyword references
    - Keyword references are tappable links navigating to `keyword/[keywordId]`
    - Track scroll position via `onScrollPositionChange` callback
    - Support `initialScrollPosition` for resume learning
    - Multi-file code examples with tab interface
    - _Requirements: 2.2, 3.2, 4.2, 5.2, 6.2, 7.2, 8.2, 9.2, 10.2, 11.4, 16.1, 16.3, 16.4_

  - [x] 10.3 Implement CourseTree component
    - Create `src/components/CourseTree.tsx`
    - Render module/lesson hierarchy as expandable tree
    - Show module progress percentage, difficulty badge, lock icon for locked modules
    - Tap lesson to navigate to `course/[lessonId]`
    - Show prerequisite info on locked modules: "Hoàn thành [module name] trước"
    - _Requirements: 1.1, 1.3, 12.2_

  - [x] 10.4 Implement QuizCard component
    - Create `src/components/QuizCard.tsx`
    - Render question text, multiple-choice options
    - Highlight selected answer, show correct/incorrect after submission
    - Display explanation and link to related lesson section on wrong answer
    - _Requirements: 15.1, 15.3_

- [x] 11. Screens implementation
  - [x] 11.1 Implement LoginScreen (auth flow)
    - Create `app/(auth)/login.tsx`
    - Profile selection list with avatar
    - Optional PIN entry with shake animation on wrong PIN, max 5 attempts then 30s cooldown
    - "Create Profile" flow with name input and optional PIN
    - Auto-login if single profile with no PIN
    - _Requirements: 1.3_

  - [x] 11.2 Implement HomeScreen (resume learning)
    - Create `app/(tabs)/index.tsx`
    - Show "Continue Learning" card with last lesson info (from `@last_lesson_id`)
    - Display overall course progress percentage
    - Show module progress overview cards
    - Quick access to recent bookmarks
    - _Requirements: 12.2, 12.3, 12.4_

  - [x] 11.3 Implement CourseTreeScreen
    - Create `app/(tabs)/course/index.tsx`
    - Render CourseTree component with data from CourseStore
    - Wire module expand/collapse and lesson navigation
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 11.4 Implement LessonScreen
    - Create `app/(tabs)/course/[lessonId].tsx`
    - Load lesson content from WatermelonDB, render via ContentRenderer
    - "Mark as Complete" button at bottom
    - Bookmark toggle button in header
    - Navigate to quiz from lesson
    - Save scroll position on leave, restore on return
    - _Requirements: 2.2, 12.1, 14.1, 16.1, 17.5_

  - [x] 11.5 Implement SearchScreen
    - Create `app/(tabs)/search.tsx`
    - Search input with debounced query (300ms)
    - Show recent searches when query is empty
    - Display grouped results: Lessons, Keywords, Code Examples
    - Show "Không tìm thấy kết quả" with suggestions when no results
    - Minimum 2 characters to search, show hint "Nhập ít nhất 2 ký tự"
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 11.6 Implement BookmarksScreen
    - Create `app/(tabs)/bookmarks.tsx`
    - List all bookmarks sorted by creation time (newest first)
    - Filter by module or content type (lesson/keyword)
    - Swipe to delete bookmark
    - Tap to navigate to bookmarked item
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 11.7 Implement ProfileScreen
    - Create `app/(tabs)/profile.tsx`
    - Show user profile info (name, avatar)
    - Display detailed progress stats per module
    - Settings: theme toggle (light/dark/system), font size slider (0.8–1.4)
    - "Reset dữ liệu" option to re-seed from JSON
    - Logout button
    - _Requirements: 12.2, 12.3, 17.4_

  - [x] 11.8 Implement QuizScreen and QuizResultScreen
    - Create `app/quiz/[quizId].tsx` — load quiz, render questions with QuizCard, navigation (next/previous), submit button
    - Create `app/quiz/result/[attemptId].tsx` — show score, per-question results with explanations, "Retake Quiz" button, link to related lesson sections
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [x] 11.9 Implement KeywordDetailScreen
    - Create `app/keyword/[keywordId].tsx`
    - Show keyword name, definition, detailed explanation, code example
    - Display related keywords as tappable links
    - Show link to parent lesson
    - Bookmark toggle
    - _Requirements: 11.1, 11.2, 11.4_

- [x] 12. Checkpoint — Verify full UI integration
  - Ensure all tests pass, ask the user if questions arise.
  - Verify navigation flows: auth → home → course → lesson → quiz → result
  - Verify search, bookmarks, and profile screens work end-to-end

- [ ] 13. Data invariant property tests
  - [ ]* 13.1 Write property test: All lessons contain at least one code block (Property 2)
    - **Property 2: All lessons contain at least one code block**
    - For any lesson in the database, verify parsed `content_json` contains at least one section of type `code_block`
    - **Validates: Requirements 2.2, 3.2, 4.2**

  - [ ]* 13.2 Write property test: Keyword entry completeness (Property 3)
    - **Property 3: Keyword entry completeness**
    - For any keyword, verify non-empty `name`, `definition` ≤ 100 chars, non-empty `explanation`, and valid `lesson_id` referencing an existing lesson
    - **Validates: Requirements 11.1**

  - [ ]* 13.3 Write property test: Every lesson has a quiz with sufficient questions (Property 11)
    - **Property 11: Every lesson has a quiz with sufficient questions**
    - For any lesson, verify at least one quiz exists and that quiz has ≥ 3 questions
    - **Validates: Requirements 15.1**

- [x] 14. Error handling and edge cases
  - [x] 14.1 Implement database error handling
    - Wrap all WatermelonDB writes in try/catch with toast "Lưu thất bại, vui lòng thử lại" and automatic retry once
    - Return empty/default state on read failures with inline error message and retry button
    - Handle malformed `content_json` with "Nội dung bị lỗi" placeholder
    - Default missing code block language to `'java'`
    - _Requirements: 17.1, 17.5_

  - [x] 14.2 Implement navigation error handling
    - Deep link to non-existent lesson → redirect to course tree with toast "Bài học không tồn tại"
    - Accessing locked module → show lock icon with prerequisite info
    - _Requirements: 1.3_

- [x] 15. APK build configuration
  - [x] 15.1 Configure EAS Build for Android APK
    - Create/update `eas.json` with build profile for Android APK (not AAB)
    - Configure `app.json` / `app.config.ts` with app name, package name, version, icon, splash screen
    - Set Android target SDK, minimum SDK for Samsung S24 Ultra compatibility
    - Configure WatermelonDB JSI adapter for production build
    - Ensure seed data JSON files are bundled in `assets/`
    - _Requirements: 17.1, 18.2_

  - [x] 15.2 Build and verify APK
    - Run `eas build --platform android --profile preview` (or local build)
    - Verify APK installs and runs on Android device/emulator
    - Verify first-launch seeding completes successfully
    - Verify all navigation flows work in production build
    - _Requirements: 17.1_

- [x] 16. Final checkpoint — Ensure all tests pass
  - Run full test suite: `npx jest --run`
  - Verify all property-based tests pass (15 properties × 100 iterations)
  - Verify all unit tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Text-to-Speech (TTS) feature
  - [x] 17.1 Implement TTSService
    - Create `src/services/TTSService.ts` using `expo-speech`
    - Implement `speak(text)`, `stop()`, `getVoices()`, `setRate()`, `setPitch()`
    - _Requirements: 19.1, 19.2_

  - [x] 17.2 Implement ttsStore (Zustand)
    - Create `src/stores/ttsStore.ts` with state: `isSpeaking`, `rate`, `pitch`, `selectedVoice`
    - Persist TTS preferences to AsyncStorage
    - _Requirements: 19.3_

  - [x] 17.3 Implement TTSControls component
    - Create `src/components/TTSControls.tsx` with Play/Stop, speed selector, pitch selector, voice picker
    - _Requirements: 19.2_

  - [x] 17.4 Implement extractLessonText utility
    - Create `src/utils/extractLessonText.ts` — extract plain text from LessonContent sections
    - Include headings, paragraphs, code (first line), tables, lists; skip diagrams
    - _Requirements: 19.5_

  - [x] 17.5 Integrate TTS into LessonScreen
    - Add FAB "Đọc bài" button and TTSControls panel to `app/(tabs)/course/[lessonId].tsx`
    - Auto-stop TTS on screen leave via useEffect cleanup
    - _Requirements: 19.1, 19.4_

- [x] 18. Bug fixes
  - [x] 18.1 Fix SQLiteAdapter — data persistence
    - Changed `LokiJSAdapter` to `SQLiteAdapter` in `src/database/index.ts`
    - Data now persists across app restarts
    - _Requirements: 17.1, 17.5_

  - [x] 18.2 Fix AuthGate — redirect to login
    - Added `AuthGate` component in `app/_layout.tsx`
    - Calls `loadProfiles()` and redirects to login when not authenticated
    - _Requirements: 1.3_

  - [x] 18.3 Fix CourseTree — rewrite with custom TouchableRipple
    - Replaced `List.Accordion` with custom `TouchableRipple + View` in `src/components/CourseTree.tsx`
    - Fixed rendering issues with description render functions
    - _Requirements: 1.1, 1.3_

  - [x] 18.4 Fix content_json — white screen on lesson select
    - Read `content_json` from `_raw` directly instead of relying on `@field` decorator
    - Added error boundary for JSON.parse failures
    - Fixed navigation to use object-based `router.push()` with params
    - _Requirements: 2.2, 16.1_

  - [x] 18.5 Remove module locking — all modules freely accessible
    - Removed `ModuleUnlockService` logic from `app/(tabs)/course/index.tsx`
    - Removed lock-related UI (lock icon, disabled state, lock message) from `src/components/CourseTree.tsx`
    - All modules are always expandable, all lessons always tappable
    - _Requirements: 1.3_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate the 15 correctness properties defined in the design document using `fast-check`
- The content pipeline (Task 3) must run before any runtime tasks can be tested with real data
- All code uses TypeScript strict mode — no `any`, no `!`, no `@ts-ignore`
- WatermelonDB is used for all structured data; AsyncStorage only for small settings
