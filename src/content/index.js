import cbseQuestions from '../mathTopics/CBSEMath12fc_fixed.json';
import aaTopics from '../mathTopics/IBMathAATopicData.json';
import aiTopics from '../mathTopics/IBMathAITopicData.json';
import { hashText } from '../lib/hash';

// Every bundled question in one shape:
//   { id, courseKey, topicKey, number, label, prompt, answer, solution, calculator }
// `calculator` is true/false for IB questions (Paper 2/Paper 1 style) and null for CBSE.

// Ids are hashes of the question's text, so saved progress stays attached to the right
// question when questions are added or reordered.
export { hashText };

// NCERT order, so chapters appear the way they are taught. Probability, Relations and
// Functions, and 3D Geometry have examples from both classes. Chapters missing from
// this list still appear, after the others.
const CBSE_CHAPTERS = [
  ['Sets', 'Sets', 'Class 11'],
  ['Relations And Functions', 'Relations and Functions', 'Classes 11 & 12'],
  ['Trigonometric Functions', 'Trigonometric Functions', 'Class 11'],
  [
    'Complex Numbers And Quadratic Equations',
    'Complex Numbers and Quadratic Equations',
    'Class 11',
  ],
  ['Linear Inequalities', 'Linear Inequalities', 'Class 11'],
  ['Permutation and Combination', 'Permutations and Combinations', 'Class 11'],
  ['Binomial Theorem', 'Binomial Theorem', 'Class 11'],
  ['Sequence And Series', 'Sequences and Series', 'Class 11'],
  ['Straight Lines', 'Straight Lines', 'Class 11'],
  ['Conic Sections', 'Conic Sections', 'Class 11'],
  ['Limits And Derivatives', 'Limits and Derivatives', 'Class 11'],
  ['Statistics', 'Statistics', 'Class 11'],
  ['Probability', 'Probability', 'Classes 11 & 12'],
  ['Inverse Trigo Functions', 'Inverse Trigonometric Functions', 'Class 12'],
  ['Matrices', 'Matrices', 'Class 12'],
  ['Determinants', 'Determinants', 'Class 12'],
  [
    'Continuity and Differentiability',
    'Continuity and Differentiability',
    'Class 12',
  ],
  ['Application of Derivatives', 'Application of Derivatives', 'Class 12'],
  ['Integrals', 'Integrals', 'Class 12'],
  ['Differential Equations', 'Differential Equations', 'Class 12'],
  ['Vector Algebra', 'Vector Algebra', 'Class 12'],
  ['3D Geometry', 'Three Dimensional Geometry', 'Classes 11 & 12'],
  ['Linear Programming', 'Linear Programming', 'Class 12'],
];

const questionsById = new Map();

// A question's id comes from its text. A question whose wording has been corrected
// keeps its old id, given in the data as `id`, so progress saved for it isn't lost.
function addQuestion(question, idPrefix, idSource, savedId) {
  // Two identical questions in one course would share an id; number the repeats.
  let id = savedId || `${idPrefix}${hashText(idSource)}`;
  for (let repeat = 2; questionsById.has(id); repeat += 1) {
    id = `${idPrefix}${hashText(idSource)}-${repeat}`;
  }
  const withId = { ...question, id };
  questionsById.set(id, withId);
  return withId;
}

function buildIBCourse(key, idPrefix, topics, details) {
  return {
    ...details,
    key,
    topics: topics.map(topic => ({
      key: topic.topicNumber,
      courseKey: key,
      title: topic.topic,
      label: `${topic.topicNumber} · ${topic.level}`,
      questions: topic.questions.map((question, index) =>
        addQuestion(
          {
            courseKey: key,
            topicKey: topic.topicNumber,
            number: index + 1,
            label: question.subtopic || '',
            prompt: question.question,
            answer: question.answer || '',
            solution: question.working || '',
            solutionLabel: 'Working',
            calculator:
              question.calculator === 'yes'
                ? true
                : question.calculator === 'no'
                ? false
                : null,
          },
          idPrefix,
          `${topic.topicNumber}\n${question.question}`,
          question.id,
        ),
      ),
    })),
  };
}

function buildCBSECourse() {
  const byChapter = new Map();
  cbseQuestions.forEach(question => {
    const chapter = question.Title.trim();
    if (!byChapter.has(chapter)) {
      byChapter.set(chapter, []);
    }
    byChapter.get(chapter).push(question);
  });
  const known = CBSE_CHAPTERS.filter(([key]) => byChapter.has(key));
  const others = [...byChapter.keys()]
    .filter(key => !CBSE_CHAPTERS.some(([listed]) => listed === key))
    .map(key => [key, key, '']);
  return {
    key: 'cbse',
    board: '1',
    icon: 'Σ',
    color: 'orange',
    title: 'CBSE Maths',
    subtitle: 'Classes 11 & 12 · NCERT examples',
    description: 'Worked examples for every chapter, with full solutions',
    topics: [...known, ...others].map(([key, title, label]) => ({
      key,
      courseKey: 'cbse',
      title,
      label,
      questions: byChapter.get(key).map((question, index) =>
        addQuestion(
          {
            courseKey: 'cbse',
            topicKey: key,
            number: index + 1,
            label: question.Subtitle || '',
            prompt: question.Example,
            answer: (question.Final_answer || '').trim(),
            solution: question.Solution,
            solutionLabel: 'Solution',
            calculator: null,
          },
          'c',
          `${key}\n${question.Example}`,
          question.id,
        ),
      ),
    })),
  };
}

export const COURSES = [
  buildIBCourse('ib-aa', 'a', aaTopics, {
    board: '5',
    icon: '∫',
    color: 'indigo',
    title: 'Mathematics AA',
    subtitle: 'IB · Analysis & Approaches',
    description: 'Calculus, algebra and proof for SL and HL',
  }),
  buildIBCourse('ib-ai', 'i', aiTopics, {
    board: '5',
    icon: 'π',
    color: 'teal',
    title: 'Mathematics AI',
    subtitle: 'IB · Applications & Interpretation',
    description: 'Modelling, statistics and real-world problems',
  }),
  buildCBSECourse(),
];

export function getCourse(courseKey) {
  return COURSES.find(course => course.key === courseKey) || null;
}

export function getTopic(courseKey, topicKey) {
  const course = getCourse(courseKey);
  return course?.topics.find(topic => topic.key === topicKey) || null;
}

export function getQuestion(id) {
  return questionsById.get(id) || null;
}

// Ids that no longer match a question (e.g. after its text was edited) are skipped.
export function getQuestions(ids) {
  return ids.map(getQuestion).filter(Boolean);
}

export function courseQuestions(courseKey) {
  return getCourse(courseKey)?.topics.flatMap(topic => topic.questions) || [];
}

export function topicTitle(question) {
  return getTopic(question.courseKey, question.topicKey)?.title || '';
}

// Courses for the student's board first, keeping the usual order otherwise.
export function coursesForBoard(board) {
  return [
    ...COURSES.filter(course => course.board === board),
    ...COURSES.filter(course => course.board !== board),
  ];
}

// TeX commands that only lay maths out, so they aren't worth searching for.
const LAYOUT_COMMANDS = new Set([
  'left',
  'right',
  'frac',
  'dfrac',
  'tfrac',
  'big',
  'bigg',
  'text',
  'mathrm',
  'mathbf',
  'displaystyle',
  'begin',
  'end',
  'quad',
  'qquad',
  'limits',
]);

// Plain words from text with TeX, for searching: "$\frac{dy}{dx}$" → "dy dx" and
// "$\int x\,dx$" → "int x dx", so searching for "\int" or "int" finds integrals.
function searchableText(text) {
  return String(text || '')
    .replace(/\\([A-Za-z]+)/g, (match, name) =>
      LAYOUT_COMMANDS.has(name) ? ' ' : ` ${name} `,
    )
    .replace(/[$\\{}^_&]/g, ' ')
    .toLowerCase();
}

const searchIndex = [...questionsById.values()].map(question => ({
  question,
  heading: searchableText(
    `${getCourse(question.courseKey).title} ${topicTitle(question)} ${
      question.label
    }`,
  ),
  prompt: searchableText(question.prompt),
  solution: searchableText(`${question.answer} ${question.solution}`),
}));

const searchWords = query => searchableText(query).split(/\s+/).filter(Boolean);

// Questions where every word of the query appears. Matches in the topic or question
// come before matches found only in the solution, and the courses for the student's
// `board` come first within each group.
export function searchQuestions(query, { limit = 50, board } = {}) {
  const words = searchWords(query);
  if (words.length === 0) {
    return [];
  }
  const groups = [[], [], [], []];
  for (const entry of searchIndex) {
    const main = `${entry.heading} ${entry.prompt}`;
    const other = getCourse(entry.question.courseKey).board !== board ? 1 : 0;
    if (words.every(word => main.includes(word))) {
      groups[other].push(entry.question);
    } else if (
      words.every(word => main.includes(word) || entry.solution.includes(word))
    ) {
      groups[2 + other].push(entry.question);
    }
  }
  return groups.flat().slice(0, limit);
}

// Topics whose name or label contains every word of the query, the student's board
// first: searching "probability" offers the Probability topic itself.
export function searchTopics(query, { limit = 5, board } = {}) {
  const words = searchWords(query);
  if (words.length === 0) {
    return [];
  }
  return coursesForBoard(board)
    .flatMap(course => course.topics)
    .filter(topic => {
      const text = searchableText(`${topic.title} ${topic.label ?? ''}`);
      return words.every(word => text.includes(word));
    })
    .slice(0, limit);
}
