#!/usr/bin/env node
/**
 * Generate English Vocabulary Dataset (~5000 words)
 * Reads word data from w*.js files, merges, deduplicates, outputs:
 *   - doc/english-vocabulary/words.json
 *   - doc/english-vocabulary/topics/*.json
 *   - doc/english-vocabulary/_topics.json (updated)
 *   - doc/english-vocabulary/task.md (updated)
 *
 * Usage: node scripts/vocab-gen/generate.js
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', '..', 'doc', 'english-vocabulary');
const TOPICS_DIR = path.join(OUT_DIR, 'topics');
const DATA_DIR = __dirname;

// Topic metadata
const TOPICS = [
  { id: 'daily-life', file: 'daily-life.json', name: 'Daily Life', name_vi: 'Cuộc sống hàng ngày', description: 'Everyday vocabulary: greetings, time, weather, food, shopping, home, family', description_vi: 'Từ vựng hàng ngày: chào hỏi, thời gian, thời tiết, thức ăn, mua sắm, nhà cửa, gia đình', icon_name: 'home', difficulty_level: 'A1-B2' },
  { id: 'work-business', file: 'work-business.json', name: 'Work & Business', name_vi: 'Công việc & Kinh doanh', description: 'Office, meetings, emails, deadlines, projects, management', description_vi: 'Văn phòng, họp, email, hạn chót, dự án, quản lý', icon_name: 'briefcase', difficulty_level: 'A2-C1' },
  { id: 'technology', file: 'technology.json', name: 'Technology', name_vi: 'Công nghệ', description: 'Software, hardware, internet, apps, AI, data, devices', description_vi: 'Phần mềm, phần cứng, internet, ứng dụng, AI, dữ liệu, thiết bị', icon_name: 'laptop', difficulty_level: 'A2-C1' },
  { id: 'programming-dev', file: 'programming-dev.json', name: 'Programming & Development', name_vi: 'Lập trình & Phát triển', description: 'Coding, algorithms, frameworks, debugging, deployment, architecture', description_vi: 'Viết code, thuật toán, framework, gỡ lỗi, triển khai, kiến trúc', icon_name: 'code-tags', difficulty_level: 'B1-C2' },
  { id: 'education', file: 'education.json', name: 'Education & Learning', name_vi: 'Giáo dục & Học tập', description: 'School, university, exams, studying, research', description_vi: 'Trường học, đại học, thi cử, học tập, nghiên cứu', icon_name: 'school', difficulty_level: 'A1-C1' },
  { id: 'travel', file: 'travel.json', name: 'Travel & Tourism', name_vi: 'Du lịch', description: 'Airport, hotel, directions, booking, sightseeing', description_vi: 'Sân bay, khách sạn, chỉ đường, đặt chỗ, tham quan', icon_name: 'airplane', difficulty_level: 'A1-B2' },
  { id: 'health', file: 'health.json', name: 'Health & Fitness', name_vi: 'Sức khỏe & Thể dục', description: 'Body, symptoms, medicine, exercise, nutrition', description_vi: 'Cơ thể, triệu chứng, thuốc, tập thể dục, dinh dưỡng', icon_name: 'heart-pulse', difficulty_level: 'A1-C1' },
  { id: 'communication', file: 'communication.json', name: 'Communication', name_vi: 'Giao tiếp', description: 'Speaking, writing, listening, debate, presentation', description_vi: 'Nói, viết, nghe, tranh luận, thuyết trình', icon_name: 'message-circle', difficulty_level: 'A2-C1' },
  { id: 'emotion-personality', file: 'emotion-personality.json', name: 'Emotions & Personality', name_vi: 'Cảm xúc & Tính cách', description: 'Feelings, character traits, relationships', description_vi: 'Cảm xúc, đặc điểm tính cách, mối quan hệ', icon_name: 'emoticon', difficulty_level: 'A2-C1' },
  { id: 'finance', file: 'finance.json', name: 'Finance & Money', name_vi: 'Tài chính & Tiền bạc', description: 'Banking, investment, budget, tax, insurance', description_vi: 'Ngân hàng, đầu tư, ngân sách, thuế, bảo hiểm', icon_name: 'cash', difficulty_level: 'B1-C2' },
  { id: 'social-relationships', file: 'social-relationships.json', name: 'Social & Relationships', name_vi: 'Xã hội & Quan hệ', description: 'Community, friendship, dating, marriage, events', description_vi: 'Cộng đồng, tình bạn, hẹn hò, hôn nhân, sự kiện', icon_name: 'account-group', difficulty_level: 'A2-B2' },
  { id: 'food-cooking', file: 'food-cooking.json', name: 'Food & Cooking', name_vi: 'Ẩm thực & Nấu ăn', description: 'Ingredients, recipes, kitchen, restaurants, flavors', description_vi: 'Nguyên liệu, công thức, nhà bếp, nhà hàng, hương vị', icon_name: 'food', difficulty_level: 'A1-B2' },
  { id: 'environment-nature', file: 'environment-nature.json', name: 'Environment & Nature', name_vi: 'Môi trường & Thiên nhiên', description: 'Climate, pollution, sustainability, animals, geography', description_vi: 'Khí hậu, ô nhiễm, bền vững, động vật, địa lý', icon_name: 'leaf', difficulty_level: 'A2-C1' },
  { id: 'media-entertainment', file: 'media-entertainment.json', name: 'Media & Entertainment', name_vi: 'Truyền thông & Giải trí', description: 'Movies, music, social media, news, gaming', description_vi: 'Phim, nhạc, mạng xã hội, tin tức, trò chơi', icon_name: 'play-circle', difficulty_level: 'A1-C1' },
  { id: 'sports-fitness', file: 'sports-fitness.json', name: 'Sports & Fitness', name_vi: 'Thể thao & Rèn luyện', description: 'Sports, gym, competition, training, team', description_vi: 'Thể thao, phòng gym, thi đấu, tập luyện, đội', icon_name: 'run', difficulty_level: 'A1-B2' },
  { id: 'shopping-consumer', file: 'shopping-consumer.json', name: 'Shopping & Consumer', name_vi: 'Mua sắm & Tiêu dùng', description: 'Stores, prices, discounts, online shopping, products', description_vi: 'Cửa hàng, giá cả, giảm giá, mua sắm trực tuyến, sản phẩm', icon_name: 'cart', difficulty_level: 'A1-B2' },
  { id: 'housing-home', file: 'housing-home.json', name: 'Housing & Home', name_vi: 'Nhà ở & Gia đình', description: 'Rooms, furniture, rent, repair, neighborhood', description_vi: 'Phòng, nội thất, thuê nhà, sửa chữa, khu phố', icon_name: 'home-city', difficulty_level: 'A1-B2' },
  { id: 'law-government', file: 'law-government.json', name: 'Law & Government', name_vi: 'Pháp luật & Chính phủ', description: 'Legal terms, politics, rights, regulations, court', description_vi: 'Thuật ngữ pháp lý, chính trị, quyền, quy định, tòa án', icon_name: 'gavel', difficulty_level: 'B1-C2' },
  { id: 'science', file: 'science.json', name: 'Science', name_vi: 'Khoa học', description: 'Biology, chemistry, physics, research, experiment', description_vi: 'Sinh học, hóa học, vật lý, nghiên cứu, thí nghiệm', icon_name: 'flask', difficulty_level: 'B1-C2' },
  { id: 'idioms-phrasal-verbs', file: 'idioms-phrasal-verbs.json', name: 'Idioms & Phrasal Verbs', name_vi: 'Thành ngữ & Cụm động từ', description: 'Common idioms and phrasal verbs in daily English', description_vi: 'Thành ngữ và cụm động từ phổ biến', icon_name: 'puzzle', difficulty_level: 'B1-C2' },
  { id: 'interview-career', file: 'interview-career.json', name: 'Interview & Career', name_vi: 'Phỏng vấn & Sự nghiệp', description: 'Job interviews, CV, career development', description_vi: 'Phỏng vấn xin việc, CV, phát triển sự nghiệp', icon_name: 'account-tie', difficulty_level: 'B1-C1' },
  { id: 'academic-ielts', file: 'academic-ielts.json', name: 'Academic & IELTS', name_vi: 'Học thuật & IELTS', description: 'Academic vocabulary for IELTS/TOEFL', description_vi: 'Từ vựng học thuật cho IELTS/TOEFL', icon_name: 'certificate', difficulty_level: 'B2-C2' },
  { id: 'transportation', file: 'transportation.json', name: 'Transportation', name_vi: 'Giao thông', description: 'Vehicles, traffic, public transport, driving', description_vi: 'Phương tiện, giao thông, vận tải công cộng, lái xe', icon_name: 'bus', difficulty_level: 'A1-B2' },
  { id: 'clothing-fashion', file: 'clothing-fashion.json', name: 'Clothing & Fashion', name_vi: 'Quần áo & Thời trang', description: 'Clothes, accessories, style, trends', description_vi: 'Quần áo, phụ kiện, phong cách, xu hướng', icon_name: 'tshirt-crew', difficulty_level: 'A1-B2' },
  { id: 'art-culture', file: 'art-culture.json', name: 'Art & Culture', name_vi: 'Nghệ thuật & Văn hóa', description: 'Music, painting, literature, theater, traditions', description_vi: 'Âm nhạc, hội họa, văn học, sân khấu, truyền thống', icon_name: 'palette', difficulty_level: 'A2-C1' },
];

// Load all w*.js data files
function loadAllWords() {
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.startsWith('w') && f.endsWith('.js'))
    .sort();

  let all = [];
  for (const f of files) {
    const mod = require(path.join(DATA_DIR, f));
    if (Array.isArray(mod)) {
      all = all.concat(mod);
    } else if (mod.words && Array.isArray(mod.words)) {
      all = all.concat(mod.words);
    }
    console.log(`  Loaded ${f}: ${(mod.words || mod).length} words`);
  }
  return all;
}

// Expand compact word to full format
// Compact: { w, i, p, pos, lv, me, mv, ee, ev, c, s, a, t }
// or: { w, i, p, pos, lv, ms:[{me,mv,ee,ev},...], c, s, a, t }
function expandWord(cw) {
  const meanings = cw.ms
    ? cw.ms.map(m => ({
        meaning_en: m.me,
        meaning_vi: m.mv,
        example_en: m.ee,
        example_vi: m.ev,
      }))
    : [{
        meaning_en: cw.me,
        meaning_vi: cw.mv,
        example_en: cw.ee,
        example_vi: cw.ev,
      }];

  return {
    word: cw.w,
    ipa: cw.i,
    pronunciation: cw.p,
    part_of_speech: cw.pos.split(','),
    level: cw.lv,
    meanings,
    collocations: cw.c ? cw.c.split('|') : [],
    synonyms: cw.s ? cw.s.split('|') : [],
    antonyms: cw.a ? cw.a.split('|') : [],
    _topics: cw.t ? cw.t.split('|') : [],
  };
}

function main() {
  console.log('Loading word data files...');
  const rawWords = loadAllWords();
  console.log(`Total raw entries: ${rawWords.length}`);

  // Expand and deduplicate
  const seen = new Set();
  const words = [];
  const topicMap = {};
  TOPICS.forEach(t => { topicMap[t.id] = []; });

  for (const cw of rawWords) {
    const expanded = expandWord(cw);
    const key = expanded.word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    // Map to topics
    for (const tid of expanded._topics) {
      if (topicMap[tid]) {
        topicMap[tid].push(expanded.word);
      }
    }

    // Remove internal _topics field
    const { _topics, ...wordEntry } = expanded;
    words.push(wordEntry);
  }

  console.log(`Unique words: ${words.length}`);

  // Ensure output dirs
  if (!fs.existsSync(TOPICS_DIR)) {
    fs.mkdirSync(TOPICS_DIR, { recursive: true });
  }

  // Write words.json
  fs.writeFileSync(
    path.join(OUT_DIR, 'words.json'),
    JSON.stringify(words, null, 2),
    'utf-8'
  );
  console.log(`Written words.json (${words.length} words)`);

  // Write topic files
  for (const topic of TOPICS) {
    const topicWords = [...new Set(topicMap[topic.id])];
    fs.writeFileSync(
      path.join(TOPICS_DIR, topic.file),
      JSON.stringify(topicWords, null, 2),
      'utf-8'
    );
    console.log(`  topics/${topic.file}: ${topicWords.length} words`);
  }

  // Write _topics.json
  const topicsMeta = TOPICS.map(t => ({
    ...t,
    word_count: topicMap[t.id] ? [...new Set(topicMap[t.id])].length : 0,
  }));
  fs.writeFileSync(
    path.join(OUT_DIR, '_topics.json'),
    JSON.stringify(topicsMeta, null, 2),
    'utf-8'
  );

  // Level distribution
  const levels = {};
  words.forEach(w => {
    levels[w.level] = (levels[w.level] || 0) + 1;
  });
  console.log('\nLevel distribution:');
  Object.entries(levels).sort().forEach(([l, c]) => console.log(`  ${l}: ${c}`));

  // Update task.md
  const completedTopics = TOPICS.filter(t => (topicMap[t.id]?.length ?? 0) > 0).map(t => t.id);
  const taskContent = `# English Vocabulary Dataset — Progress

## Status
- words_generated: true
- total_words: ${words.length}
- total_topics: ${TOPICS.length}
- completed_topics: ${completedTopics.length}/${TOPICS.length}

## Level Distribution
${Object.entries(levels).sort().map(([l, c]) => `- ${l}: ${c} words`).join('\n')}

## Topics
${TOPICS.map(t => {
  const count = topicMap[t.id] ? [...new Set(topicMap[t.id])].length : 0;
  return `- [${count > 0 ? 'x' : ' '}] ${t.name} (${t.name_vi}): ${count} words`;
}).join('\n')}
`;
  fs.writeFileSync(path.join(OUT_DIR, 'task.md'), taskContent, 'utf-8');

  console.log('\nDone!');
}

main();
