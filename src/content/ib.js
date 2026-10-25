import aaTopics from '../mathTopics/IBMathAATopicData.json';
import aiTopics from '../mathTopics/IBMathAITopicData.json';

export const IB_COURSES = {
  AA: { title: 'Mathematics AA', topics: aaTopics },
  AI: { title: 'Mathematics AI', topics: aiTopics },
};

export function getIBTopic(course, topicNumber) {
  const topics = IB_COURSES[course] ? IB_COURSES[course].topics : [];
  return topics.find(topic => topic.topicNumber === topicNumber) || null;
}
