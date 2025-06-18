import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.title}>IB Mathematics</Text>
          <Text style={styles.description}>
            Master your mathematics journey with comprehensive resources and intelligent practice.
          </Text>
        </View>
        
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={[styles.card, styles.primaryCard]}
            onPress={() => navigation.navigate('Math AA')}
            activeOpacity={0.8}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.iconText}>∫</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Mathematics AA</Text>
              <Text style={styles.cardSubtitle}>Analysis & Approaches</Text>
              <Text style={styles.cardDescription}>Advanced calculus and pure mathematics</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.secondaryCard]}
            onPress={() => navigation.navigate('Math AI')}
            activeOpacity={0.8}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.iconText}>π</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Mathematics AI</Text>
              <Text style={styles.cardSubtitle}>Applications & Interpretation</Text>
              <Text style={styles.cardDescription}>Real-world problem solving</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.accentCard]}
            onPress={() => navigation.navigate('CBSE 12')}
            activeOpacity={0.8}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.iconText}>Σ</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Grade 12 CBSE</Text>
              <Text style={styles.cardSubtitle}>Complete Curriculum</Text>
              <Text style={styles.cardDescription}>Notes, guides & practice tests</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
    paddingHorizontal: 4,
  },
  greeting: {
    fontSize: 17,
    fontWeight: '400',
    color: '#8E8E93',
    marginBottom: 4,
    letterSpacing: -0.24,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.34,
    lineHeight: 40,
  },
  description: {
    fontSize: 17,
    fontWeight: '400',
    color: '#EBEBF5',
    lineHeight: 24,
    letterSpacing: -0.24,
    opacity: 0.6,
  },
  cardContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
    minHeight: 140,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(30px)',
  },
  primaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  accentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(10, 132, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.26,
  },
  cardSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#EBEBF5',
    marginBottom: 6,
    letterSpacing: -0.24,
    opacity: 0.8,
  },
  cardDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#EBEBF5',
    lineHeight: 18,
    letterSpacing: -0.08,
    opacity: 0.6,
  },
});

export default HomeScreen;