import { spawnSync } from 'child_process';
import path from 'path';
import {
  COURSES,
  courseQuestions,
  coursesForBoard,
  getQuestion,
  getQuestions,
  getTopic,
  hashText,
  searchQuestions,
  searchTopics,
} from '../src/content';

const allQuestions = COURSES.flatMap(course => courseQuestions(course.key));

describe('courses', () => {
  it('gives every question a unique id that can be looked up', () => {
    const ids = allQuestions.map(question => question.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const question of allQuestions) {
      expect(getQuestion(question.id)).toBe(question);
      expect(question.prompt.trim()).not.toBe('');
      expect(question.solution.trim()).not.toBe('');
    }
  });

  it('derives ids from the question text, so they survive reordering', () => {
    expect(hashText('Find $x$.')).toBe(hashText('Find $x$.'));
    expect(hashText('Find $x$.')).not.toBe(hashText('Find $y$.'));
    const [question] = getTopic('cbse', 'Sets').questions;
    expect(question.id).toBe(`c${hashText(`Sets\n${question.prompt}`)}`);
  });

  it('keeps the id of a question whose wording was corrected', () => {
    // Made from the question's earlier plain-text wording; the data keeps it.
    const question = getQuestion('a12ty4pn');
    expect(question.prompt).toMatch(/^The volume of a hemisphere, \$V\$/);
    expect(question.id).not.toBe(
      `a${hashText(`${question.topicKey}\n${question.prompt}`)}`,
    );
  });

  it('shows every Probability question in its quiz', () => {
    // The quiz used to filter by `chapter`, where 20 of these were spelled
    // "probability", so only 10 of the 30 listed questions appeared.
    expect(getTopic('cbse', 'Probability').questions).toHaveLength(30);
  });

  it('lists CBSE chapters in NCERT order with their class', () => {
    const topics = COURSES.find(course => course.key === 'cbse').topics;
    expect(topics[0]).toMatchObject({ title: 'Sets', label: 'Class 11' });
    expect(topics.at(-1)).toMatchObject({
      title: 'Linear Programming',
      label: 'Class 12',
    });
    expect(
      topics.findIndex(topic => topic.key === 'Limits And Derivatives'),
    ).toBeLessThan(topics.findIndex(topic => topic.key === 'Matrices'));
  });

  it('marks IB questions as calculator or non-calculator', () => {
    for (const question of courseQuestions('ib-aa')) {
      expect(typeof question.calculator).toBe('boolean');
    }
    for (const question of courseQuestions('cbse')) {
      expect(question.calculator).toBeNull();
    }
  });

  it("puts the student's board first", () => {
    expect(coursesForBoard('1').map(course => course.key)).toEqual([
      'cbse',
      'ib-aa',
      'ib-ai',
    ]);
    expect(coursesForBoard('5')[0].key).toBe('ib-aa');
    expect(coursesForBoard('3')).toHaveLength(3);
  });

  it('skips ids of questions that no longer exist', () => {
    const [question] = allQuestions;
    expect(getQuestions(['missing', question.id])).toEqual([question]);
    expect(getTopic('cbse', 'Not a chapter')).toBeNull();
  });
});

describe('searchQuestions', () => {
  it('finds questions by topic and by words in the question', () => {
    const bayes = searchQuestions('Bayes');
    expect(bayes.length).toBeGreaterThan(0);
    expect(bayes.every(question => question.topicKey === 'Probability')).toBe(
      true,
    );

    const matrices = searchQuestions('farmers rice');
    expect(matrices[0].topicKey).toBe('Matrices');
  });

  it('needs every word to match and ignores TeX markup', () => {
    expect(searchQuestions('displaystyle')).toEqual([]);
    expect(searchQuestions('   ')).toEqual([]);
    expect(searchQuestions('probability zebra')).toEqual([]);
  });

  it('limits the number of results', () => {
    expect(searchQuestions('the', { limit: 5 })).toHaveLength(5);
  });

  it('finds questions by the TeX commands they use', () => {
    const integrals = searchQuestions('\\int');
    expect(integrals.length).toBeGreaterThan(0);
    expect(searchQuestions('int')).toEqual(integrals);
  });

  it("puts the student's board first", () => {
    const [first] = searchQuestions('x', { board: '1' });
    expect(first.courseKey).toBe('cbse');
  });
});

describe('searchTopics', () => {
  it('finds topics by name', () => {
    const [topic] = searchTopics('probability', { board: '1' });
    expect(topic.title).toBe('Probability');
    expect(topic.courseKey).toBe('cbse');
    expect(searchTopics('zebra')).toEqual([]);
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
