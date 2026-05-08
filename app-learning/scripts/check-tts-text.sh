#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 2>/dev/null || true

cd /home/hiepnt/projects/app

node -e "
const lessons = require('./assets/seed-data/lessons.json');

// Check first 3 lessons
for (let i = 0; i < 3; i++) {
  const lesson = lessons[i];
  const content = JSON.parse(lesson.content_json);
  
  // Simulate extractLessonText
  const parts = [];
  for (const section of content.sections) {
    if (section.type === 'heading' && section.text) {
      parts.push(section.text.replace(/\*\*(.+?)\*\*/g, '\$1').replace(/\`(.+?)\`/g, '\$1'));
    } else if (section.type === 'paragraph' && section.text) {
      parts.push(section.text.replace(/\*\*(.+?)\*\*/g, '\$1').replace(/\`(.+?)\`/g, '\$1'));
    } else if (section.type === 'code_block' && section.code) {
      const firstLine = section.code.split('\n')[0] || '';
      parts.push('Đoạn code: ' + firstLine.substring(0, 50));
    } else if (section.type === 'table' && section.headers) {
      parts.push('Bảng: ' + section.headers.join(', '));
    } else if (section.type === 'list' && section.items) {
      section.items.forEach((item, idx) => parts.push((idx+1) + '. ' + item));
    }
  }
  
  const text = parts.join('. ');
  console.log('--- Lesson', i+1, ':', lesson.title_vi, '---');
  console.log('Sections:', content.sections.length);
  console.log('Text length:', text.length);
  console.log('First 200 chars:', text.substring(0, 200));
  console.log('');
}
"
