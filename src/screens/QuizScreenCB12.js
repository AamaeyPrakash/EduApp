import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Platform } from 'react-native';
import MathView from 'react-native-math-view';
import CBSEMath12 from '../mathTopics/CBSEMath12c.json';

const MathText = ({ content }) => {
    // Split content by LaTeX delimiters while preserving delimiters
    const parts = content.split(/(\$\$.*?\$\$|\$.*?\$)/gs);
    
    // Process parts to handle line breaks while preserving inline elements
    const processedContent = parts.reduce((acc, part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
            // Display block math
            const math = part.slice(2, -2);
            acc.push(
                <MathView
                    key={index}
                    math={math}
                    style={styles.blockMath}
                />
            );
        } else if (part.startsWith('$') && part.endsWith('$')) {
            // Display inline math - preserve exact LaTeX
            const math = part.slice(1, -1).trim();
            acc.push(
                <MathView
                    key={index}
                    math={math}
                    style={styles.inlineMath}
                />
            );
        } else if (part) {
            // Handle regular text with line breaks
            const lines = part.split('\n');
            lines.forEach((line, lineIndex) => {
                if (lineIndex > 0) {
                    acc.push(<View key={`br-${index}-${lineIndex}`} style={styles.lineBreak} />);
                }
                if (line) {
                    acc.push(
                        <Text key={`${index}-${lineIndex}`} style={styles.regularText}>
                            {line}
                        </Text>
                    );
                }
            });
        }
        return acc;
    }, []);

    return (
        <View style={styles.mathTextContainer}>
            {processedContent}
        </View>
    );
};

const QuizScreenCB12 = ({ route, navigation }) => {
    const { topicTitle } = route.params;
    console.log("Selected Topic:", topicTitle);
    const topicData = CBSEMath12.filter(topic => topic.chapter === topicTitle);
    
    if (topicData.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.exitButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.exitButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.errorContainer}>
                    <View style={styles.errorCard}>
                        <Text style={styles.errorText}>No questions found for this topic.</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    const [showSolutions, setShowSolutions] = useState(Array(topicData.length).fill(false));

    const toggleSolution = (index) => {
        setShowSolutions(prev => {
            const updatedSolutions = [...prev];
            updatedSolutions[index] = !updatedSolutions[index];
            return updatedSolutions;
        });
    };

    const handleExit = () => {
        navigation.goBack();
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
            
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.topicText}>{topicTitle}</Text>
                {topicData.map((question, index) => (
                    <View key={index} style={styles.card}>
                        <Text style={styles.subtopicText}>Concept: {question.Title}</Text>
                        <View style={styles.questionContainer}>
                            <MathText content={question.Example} />
                        </View>
                        {showSolutions[index] && (
                            <View style={styles.solutionContainer}>
                                <Text style={styles.solutionLabel}>Solution:</Text>
                                <MathText content={question.Solution} />
                            </View>
                        )}
                        <TouchableOpacity 
                            onPress={() => toggleSolution(index)} 
                            style={styles.button}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>
                                {showSolutions[index] ? "Hide Solution" : "Show Solution"}
                            </Text>
                        </TouchableOpacity>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 0,
    },
    exitButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        // Neomorphism effect
        borderTopColor: 'rgba(255, 255, 255, 0.2)',
        borderLeftColor: 'rgba(255, 255, 255, 0.2)',
        borderRightColor: 'rgba(0, 0, 0, 0.3)',
        borderBottomColor: 'rgba(0, 0, 0, 0.3)',
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
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    topicText: {
        fontSize: 34,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 40,
        textAlign: 'center',
        letterSpacing: -0.34,
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 24,
        padding: 24,
        width: '90%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 32,
        elevation: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(30px)',
    },
    subtopicText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#EBEBF5',
        marginBottom: 16,
        opacity: 0.7,
        letterSpacing: -0.14,
        textAlign: 'center',
    },
    questionContainer: {
        width: '100%',
        marginBottom: 16,
    },
    mathTextContainer: {
        width: '100%',
        marginVertical: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    regularText: {
        fontSize: 16,
        color: '#FFFFFF',
        lineHeight: 24,
        letterSpacing: -0.16,
    },
    lineBreak: {
        width: '100%',
        height: 8,
    },
    inlineMath: {
        height: 20,
        transform: [{ scale: 0.90 }],
        alignSelf: 'center',
    },
    blockMath: {
        alignSelf: 'center',
        marginVertical: 12,
        height: 24,
        transform: [{ scale: 0.8 }],
        width: '100%',
    },
    solutionContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: 16,
        marginTop: 12,
        marginBottom: 12,
        width: '100%',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    solutionLabel: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'left',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: -0.24,
    },
    button: {
        backgroundColor: 'rgba(10, 132, 255, 0.9)',
        borderRadius: 18,
        padding: 16,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: -0.16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 32,
        elevation: 12,
    },
    errorText: {
        fontSize: 18,
        color: '#FF453A',
        textAlign: 'center',
        fontWeight: '500',
        letterSpacing: -0.18,
    },
});

export default QuizScreenCB12;