import { spawnSync } from 'child_process';
import path from 'path';
import { CBSE_CHAPTERS, getChapterQuestions } from '../src/content/cbse';
import { getIBTopic, IB_COURSES } from '../src/content/ib';

describe('CBSE content', () => {
  it('lists each chapter once with its questions', () => {
    const titles = CBSE_CHAPTERS.map(chapter => chapter.title);
    expect(new Set(titles).size).toBe(titles.length);
    for (const chapter of CBSE_CHAPTERS) {
      expect(chapter.questionCount).toBeGreaterThan(0);
      expect(getChapterQuestions(chapter.title)).toHaveLength(
        chapter.questionCount,
      );
    }
  });

  it('shows every Probability question in its quiz', () => {
    // The quiz used to filter by `chapter`, where 20 of these were spelled
    // "probability", so only 10 of the 30 listed questions appeared.
    const chapter = CBSE_CHAPTERS.find(item => item.title === 'Probability');
    expect(chapter.questionCount).toBe(30);
    expect(getChapterQuestions('Probability')).toHaveLength(30);
  });

  it('returns no questions for an unknown chapter', () => {
    expect(getChapterQuestions('Not a chapter')).toEqual([]);
  });
});

describe('IB content', () => {
  it('finds topics by course and topic number', () => {
    for (const key of Object.keys(IB_COURSES)) {
      const [first] = IB_COURSES[key].topics;
      expect(getIBTopic(key, first.topicNumber)).toBe(first);
    }
    expect(getIBTopic('AA', 'Topic 99')).toBeNull();
    expect(getIBTopic('XX', 'Topic 1')).toBeNull();
  });
});

it('passes the content validator (fields present, every formula parses)', () => {
  const root = path.join(__dirname, '..');
  const run = spawnSync(
    process.execPath,
    [
      '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',
      'scripts/validate-content.mjs',
    ],
    { cwd: root, encoding: 'utf8' },
  );
  expect(run.stderr).toBe('');
  expect(run.status).toBe(0);
  expect(run.stdout).toMatch(/0 error\(s\), 0 warning\(s\)/);
}, 60000);
