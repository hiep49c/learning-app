#!/usr/bin/env node
/**
 * Generate seed data for English Vocabulary module.
 * Reads doc/english-vocabulary/ and outputs assets/seed-data/vocab-*.json
 * 
 * Maps: Topic → Module, Level-within-topic → Lesson, Word → Keyword,
 *        Example sentence → CodeExample, Auto-generated → Quiz/QuizQuestion
 * 
 * Usage: node scripts/generate-vocab-seed.js
 */

const fs = require('fs');
const path = require('path');

const VOCAB_DIR = path.join(__dirname, '..', 'doc', 'english-vocabulary');
const OUT_DIR = path.join(__dirname, '..', 'assets', 'seed-data');

// ─── Load source data ───
const words = JSON.parse(fs.readFileSync(path.join(VOCAB_DIR, 'words.json'), 'utf8'));
const topicsMeta = JSON.parse(fs.readFileSync(path.join(VOCAB_DIR, '_topics.json'), 'utf8'));
const levelsMeta = JSON.parse(fs.readFileSync(path.join(VOCAB_DIR, '_levels.json'), 'utf8'));

// Load topic word lists
const topicWords = {};
for (const t of topicsMeta) {
  const fp = path.join(VOCAB_DIR, 'topics', t.file);
  if (fs.existsSync(fp)) {
    topicWords[t.id] = JSON.parse(fs.readFileSync(fp, 'utf8'));
  }
}

// Build word lookup by word string
const wordMap = new Map();
for (const w of words) {
  wordMap.set(w.word.toLowerCase(), w);
}

// ─── Constants ───
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const WORDS_PER_LESSON = 30; // Group words into lessons of ~30

// ─── Deterministic hash for shuffling ───
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ─── Generate modules (1 per topic) ───
const modules = [];
const lessons = [];
const keywords = [];
const codeExamples = [];
const quizzes = [];
const quizQuestions = [];
const keywordRelations = [];

let topicOrder = 100; // Start at 100 to not conflict with Java Spring modules (1-9)

for (const topic of topicsMeta) {
  const topicId = `vocab-topic-${topic.id}`;
  
  // Get words for this topic, grouped by level
  const topicWordList = (topicWords[topic.id] || [])
    .map(w => typeof w === 'string' ? wordMap.get(w.toLowerCase()) : w)
    .filter(Boolean);
  
  if (topicWordList.length === 0) continue;

  // Group by level
  const byLevel = {};
  for (const w of topicWordList) {
    const lv = w.level || 'B1';
    if (!byLevel[lv]) byLevel[lv] = [];
    byLevel[lv].push(w);
  }

  // Count total lessons for this topic
  let lessonCount = 0;
  for (const lv of LEVELS) {
    if (!byLevel[lv] || byLevel[lv].length === 0) continue;
    lessonCount += Math.ceil(byLevel[lv].length / WORDS_PER_LESSON);
  }

  modules.push({
    id: topicId,
    title: topic.name,
    title_vi: topic.name_vi,
    description: `${topic.description} — ${topic.description_vi}`,
    order_index: topicOrder++,
    difficulty_level: topic.difficulty_level,
    icon_name: topic.icon_name,
    lesson_count: lessonCount,
  });

  // Generate lessons per level
  let lessonOrder = 1;
  for (const lv of LEVELS) {
    const levelWords = byLevel[lv];
    if (!levelWords || levelWords.length === 0) continue;

    // Sort alphabetically for consistency
    levelWords.sort((a, b) => a.word.localeCompare(b.word));

    // Split into chunks of WORDS_PER_LESSON
    const chunks = [];
    for (let i = 0; i < levelWords.length; i += WORDS_PER_LESSON) {
      chunks.push(levelWords.slice(i, i + WORDS_PER_LESSON));
    }

    for (let ci = 0; ci < chunks.length; ci++) {
      const chunk = chunks[ci];
      const partSuffix = chunks.length > 1 ? ` (${ci + 1})` : '';
      const lessonId = `vocab-lesson-${topic.id}-${lv.toLowerCase()}${chunks.length > 1 ? '-' + (ci + 1) : ''}`;
      const lvMeta = levelsMeta.find(l => l.level === lv) || {};

      // Build lesson content as JSON (word list with details)
      const contentSections = [
        { type: 'heading', level: 1, content: `${topic.name_vi} — ${lv}${partSuffix}` },
        { type: 'paragraph', content: `${chunk.length} từ vựng level ${lv} (${lvMeta.name_vi || lv}) trong chủ đề ${topic.name_vi}.` },
      ];

      // Add each word as content sections
      for (const w of chunk) {
        contentSections.push(
          { type: 'heading', level: 2, content: `${w.word} ${w.ipa}` },
          { type: 'paragraph', content: `📝 ${w.part_of_speech.join(', ')} — ${w.meanings[0].meaning_vi}` },
          { type: 'paragraph', content: `🔤 ${w.meanings[0].meaning_en}` },
          { type: 'code_block', language: 'text', content: `${w.meanings[0].example_en}\n${w.meanings[0].example_vi}` },
        );
        if (w.collocations.length > 0) {
          contentSections.push({ type: 'paragraph', content: `💬 Collocations: ${w.collocations.join(', ')}` });
        }
        if (w.synonyms.length > 0) {
          contentSections.push({ type: 'paragraph', content: `🔗 Synonyms: ${w.synonyms.join(', ')}` });
        }
        if (w.antonyms.length > 0) {
          contentSections.push({ type: 'paragraph', content: `↔️ Antonyms: ${w.antonyms.join(', ')}` });
        }
      }

      lessons.push({
        id: lessonId,
        module_id: topicId,
        title: `${lv} ${topic.name}${partSuffix}`,
        title_vi: `${lv} ${topic.name_vi}${partSuffix}`,
        description: `${chunk.length} từ vựng ${lv} — ${topic.name_vi}`,
        order_index: lessonOrder++,
        content_json: JSON.stringify(contentSections),
        source_file: `vocab/${topic.id}/${lv}`,
        estimated_minutes: Math.max(5, Math.ceil(chunk.length * 0.5)),
      });

      // Generate keywords (1 per word)
      for (const w of chunk) {
        const kwId = `vocab-kw-${slugify(w.word)}-${topic.id}`;
        const explanation = [
          `Phát âm: ${w.pronunciation}`,
          w.collocations.length > 0 ? `Collocations: ${w.collocations.join(', ')}` : '',
          w.synonyms.length > 0 ? `Synonyms: ${w.synonyms.join(', ')}` : '',
          w.antonyms.length > 0 ? `Antonyms: ${w.antonyms.join(', ')}` : '',
        ].filter(Boolean).join('\n');

        const kwEntry = {
          id: kwId,
          lesson_id: lessonId,
          name: w.word,
          definition: `${w.meanings[0].meaning_vi} — ${w.meanings[0].meaning_en}`,
          explanation,
          code_example: `${w.meanings[0].example_en}\n---\n${w.meanings[0].example_vi}`,
          category: lv,
        };
        if (w.usage_notes) kwEntry.usage_notes = w.usage_notes;
        if (w.extra_examples && w.extra_examples.length > 0) kwEntry.extra_examples = w.extra_examples;
        if (w.common_patterns) kwEntry.common_patterns = w.common_patterns;
        keywords.push(kwEntry);

        // Code example (example sentence)
        codeExamples.push({
          id: `vocab-ex-${slugify(w.word)}-${topic.id}`,
          lesson_id: lessonId,
          title: w.word,
          description: `${w.ipa} — ${w.part_of_speech.join(', ')}`,
          code: `${w.meanings[0].example_en}\n\n${w.meanings[0].example_vi}`,
          language: 'text',
          file_name: null,
          order_index: 0,
        });
      }

      // Generate quiz for this lesson (5 questions from chunk words)
      const quizId = `vocab-quiz-${topic.id}-${lv.toLowerCase()}${chunks.length > 1 ? '-' + (ci + 1) : ''}`;
      const quizWordPool = chunk.filter(w => w.meanings[0].meaning_vi.length > 0);
      const qCount = Math.min(5, quizWordPool.length);

      if (qCount >= 3) {
        quizzes.push({
          id: quizId,
          lesson_id: lessonId,
          title: `Quiz: ${lv} ${topic.name_vi}${partSuffix}`,
          question_count: qCount,
        });

        // Pick qCount words for questions (deterministic)
        const sorted = [...quizWordPool].sort((a, b) => hashStr(a.word + quizId) - hashStr(b.word + quizId));
        const selected = sorted.slice(0, qCount);

        for (let qi = 0; qi < selected.length; qi++) {
          const qWord = selected[qi];
          // Get 3 wrong answers from other words in the chunk
          const wrongPool = quizWordPool
            .filter(w => w.word !== qWord.word)
            .sort((a, b) => hashStr(a.word + qWord.word) - hashStr(b.word + qWord.word))
            .slice(0, 3);

          const options = [
            qWord.meanings[0].meaning_vi,
            ...wrongPool.map(w => w.meanings[0].meaning_vi),
          ];
          // Deterministic shuffle
          options.sort((a, b) => hashStr(a + quizId + qi) - hashStr(b + quizId + qi));

          quizQuestions.push({
            id: `vocab-qq-${slugify(qWord.word)}-${topic.id}-${lv.toLowerCase()}`,
            quiz_id: quizId,
            question_text: `"${qWord.word}" (${qWord.ipa}) nghĩa là gì?`,
            question_type: 'vocab_meaning',
            options_json: JSON.stringify(options),
            correct_answer: qWord.meanings[0].meaning_vi,
            explanation: `${qWord.word} = ${qWord.meanings[0].meaning_vi} (${qWord.meanings[0].meaning_en}).\nVí dụ: ${qWord.meanings[0].example_en}`,
            related_keyword_id: `vocab-kw-${slugify(qWord.word)}-${topic.id}`,
            order_index: qi + 1,
          });
        }
      }
    }
  }
}

// Generate keyword relations (synonyms within same topic)
const kwByTopic = {};
for (const kw of keywords) {
  const topicId = kw.id.split('-').slice(2).join('-').replace(/-[^-]+$/, ''); // extract topic from id
  if (!kwByTopic[topicId]) kwByTopic[topicId] = [];
  kwByTopic[topicId].push(kw);
}

// ─── Write output ───
function writeJson(name, data) {
  const fp = path.join(OUT_DIR, name);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));
  console.log(`  ${name}: ${data.length} records`);
}

console.log('Generating English Vocabulary seed data...\n');
writeJson('vocab-modules.json', modules);
writeJson('vocab-lessons.json', lessons);
writeJson('vocab-keywords.json', keywords);
writeJson('vocab-code-examples.json', codeExamples);
writeJson('vocab-quizzes.json', quizzes);
writeJson('vocab-quiz-questions.json', quizQuestions);

// Empty files for compatibility
writeJson('vocab-keyword-relations.json', []);
writeJson('vocab-module-prerequisites.json', []);

console.log(`\nDone! ${modules.length} topics, ${lessons.length} lessons, ${keywords.length} words, ${quizzes.length} quizzes, ${quizQuestions.length} questions`);
