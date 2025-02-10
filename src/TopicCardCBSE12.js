import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import CBSEMath12 from './mathTopics/CBSEMath12.json';

const TopicCardCBSE12 = ({ navigation }) => {
  const uniqueTitles = Array.from(new Set(CBSEMath12.map(item => item.Title)));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {uniqueTitles.map((title, index) => (
          <View key={index} style={styles.card}>  
            <Text style={styles.cardTitle}>{title}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.buttonSecondary}>
                <Text style={styles.buttonSecondaryText}>Revisions</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.buttonPrimary} 
                onPress={() => navigation.navigate('CBQuizScreen', { topicTitle: title })}
              >
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
    backgroundColor: '#F0F4F8',
  },
  content: {
    flex: 1,
    padding: 16,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
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
    marginBottom: 16,
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
  },
});

export default TopicCardCBSE12;