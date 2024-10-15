import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, Button } from 'react-native';
import IBMathTopicData from './mathTopics/IBMathTopicData.json';

const TopicScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {IBMathTopicData.map((subject, index) => (
          <View key={index} style={styles.card}>  
            <Text style={styles.cardTitle}>{subject.topic} - {subject.name}</Text>
            <Text style={styles.cardTopic}>{subject.subtopics[0]}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.buttonSecondary}>
                <Text style={styles.buttonSecondaryText}>Revisions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.buttonPrimary} onPress={() => navigation.navigate('QuizScreen')}>
                <Text style={styles.buttonPrimaryText}>Quiz</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardTopic: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingVertical: 8,
    marginRight: 8,
  },
  buttonSecondaryText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  buttonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingVertical: 8,
    marginLeft: 8,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default TopicScreen;