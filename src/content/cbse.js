import questions from '../mathTopics/CBSEMath12fc_fixed.json';

// Questions grouped by chapter (`Title`), keeping the order of the data file.
const questionsByChapter = new Map();
questions.forEach(question => {
  const chapter = question.Title.trim();
  if (!questionsByChapter.has(chapter)) {
    questionsByChapter.set(chapter, []);
  }
  questionsByChapter.get(chapter).push(question);
});

export const CBSE_CHAPTERS = Array.from(
  questionsByChapter,
  ([title, chapterQuestions]) => ({
    title,
    questionCount: chapterQuestions.length,
  }),
);

export function getChapterQuestions(chapter) {
  return questionsByChapter.get(chapter) || [];
}
