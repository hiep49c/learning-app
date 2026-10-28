/**
 * Self-test for app-taichi core logic (runs under tsx, no RN runtime needed).
 * Verifies: dataset integrity, TTS text extraction, search normalization,
 * copy-support (selectable) presence in renderer, and video fallback wiring.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { FORMS, getFormById, getFormByOrder } from '../src/data';
import { extractFormText } from '../src/utils/extractFormText';

let passed = 0;
let failed = 0;
const fails: string[] = [];

function check(name: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    fails.push(name);
    console.log(`  ✗ ${name}`);
  }
}

console.log('\n[1] Dataset — 24 forms integrity');
check('Có đúng 24 thức', FORMS.length === 24);
check('order liên tục 1..24', FORMS.every((f, i) => f.order === i + 1));
check('id duy nhất', new Set(FORMS.map((f) => f.id)).size === 24);
check('mọi thức có tên Hán Việt', FORMS.every((f) => f.nameHanViet.trim().length > 0));
check('mọi thức có nghĩa tiếng Việt', FORMS.every((f) => f.nameVi.trim().length > 0));
check('mọi thức có pinyin + tên EN', FORMS.every((f) => f.namePinyin && f.nameEn));
check('thức 1 là Khởi thế', FORMS[0].nameHanViet === 'Khởi thế');
check('thức 24 là Thu thế', FORMS[23].nameHanViet === 'Thu thế');
check('getFormById("07") trả đúng Lãm tước vĩ', getFormById('07')?.nameHanViet.includes('lãm tước vĩ') ?? false);
check('getFormByOrder(10) là Vân thủ', getFormByOrder(10)?.nameHanViet === 'Vân thủ');

console.log('\n[2] Mỗi thức có nội dung chi tiết');
check('mọi thức có ≥1 heading', FORMS.every((f) => f.sections.some((s) => s.type === 'heading')));
check('mọi thức có ≥1 image (minh họa)', FORMS.every((f) => f.sections.some((s) => s.type === 'image')));
check('mọi thức có ≥1 video', FORMS.every((f) => f.sections.some((s) => s.type === 'video')));
check(
  'mọi thức có trình tự động tác (list ordered)',
  FORMS.every((f) => f.sections.some((s) => s.type === 'list' && s.ordered)),
);
check(
  'các thức đá/hạ thấp có callout an toàn',
  [13, 15, 16, 17, 19].every((o) => {
    const f = getFormByOrder(o)!;
    return f.hasSafetyNote && f.sections.some((s) => s.type === 'callout' && s.variant === 'safety');
  }),
);

console.log('\n[3] Đọc nội dung (TTS) — extractFormText');
const t1 = extractFormText(FORMS[0].sections);
check('trích được text không rỗng', t1.length > 20);
check('đã strip markdown **bold**', !t1.includes('**'));
check('đã strip `code`', !t1.includes('`'));
check('video được đọc thành mô tả', t1.includes('video hướng dẫn'));
check('image được đọc thành mô tả', t1.includes('hình minh họa'));
check('mọi thức đều trích được text', FORMS.every((f) => extractFormText(f.sections).length > 20));

console.log('\n[4] Tìm kiếm — normalize tiếng Việt');
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}
function search(q: string) {
  const n = normalize(q.trim());
  if (!n) return FORMS;
  return FORMS.filter((f) =>
    [f.nameHanViet, f.nameVi, f.namePinyin, f.nameEn, f.summary].map(normalize).some((x) => x.includes(n)),
  );
}
check('tìm "van thu" (không dấu) ra Vân thủ', search('van thu').some((f) => f.nameHanViet === 'Vân thủ'));
check('tìm "ngựa" ra Dã mã phân bờm', search('ngựa').some((f) => f.order === 2));
check('tìm "single whip" ra Đơn tiên', search('single whip').some((f) => f.nameHanViet === 'Đơn tiên'));
check('query rỗng trả toàn bộ 24', search('').length === 24);
check('tìm "xyz123" trả rỗng', search('xyz123').length === 0);

console.log('\n[5] Copy text — selectable trong renderer');
const renderer = readFileSync(join(__dirname, '..', 'src', 'components', 'ContentRenderer.tsx'), 'utf8');
check('heading có selectable', /heading[\s\S]*?selectable/.test(renderer));
const selectableCount = (renderer.match(/selectable/g) ?? []).length;
check('có nhiều block selectable (≥5)', selectableCount >= 5);

console.log('\n[6] Video fallback — mở YouTube khi không có videoId');
const videoBlock = readFileSync(join(__dirname, '..', 'src', 'components', 'VideoBlock.tsx'), 'utf8');
check('VideoBlock có nút mở ngoài', videoBlock.includes('openExternal') && videoBlock.includes('Linking.openURL'));
check('mọi video có source URL (mở được)', FORMS.every((f) => f.sections.filter((s) => s.type === 'video').every((s: any) => s.source?.url?.startsWith('http'))));

console.log(`\n=== KẾT QUẢ: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  console.log('Thất bại:', fails.join(' | '));
  process.exit(1);
}
