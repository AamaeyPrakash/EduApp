import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet } from 'react-native';
import CBSEMath12 from './mathTopics/CBSEMath12f.json';

const TopicCardCBSE12 = ({ navigation }) => {
  const uniqueTitles = Array.from(new Set(CBSEMath12.map(item => item.Title)));
  
  const handleExit = () => {
    navigation.goBack(); // Goes back to the previous screen
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={handleExit}
          activeOpacity={0.8}
        >
          <Text style={styles.exitButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {uniqueTitles.map((title, index) => (
          <View key={index} style={styles.card}>  
            <Text style={styles.cardTitle}>{title}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.buttonSecondary}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonSecondaryText}>Revisions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={() => navigation.navigate('CBQuizScreen', { topicTitle: title })}
                activeOpacity={0.8}
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
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  exitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    // Neomorphism effect
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  exitButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backdropFilter: 'blur(30px)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  buttonSecondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.16,
  },
  buttonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 132, 255, 0.9)',
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.16,
  },
});

export default TopicCardCBSE12;