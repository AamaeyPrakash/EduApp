import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
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

const QuizScreenCB12 = ({ route }) => {
    const { topicTitle } = route.params;
    console.log("Selected Topic:", topicTitle);
    const topicData = CBSEMath12.filter(topic => topic.chapter === topicTitle);
    
    if (topicData.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No questions found for this topic.</Text>
            </View>
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

    return (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.topicText}>{topicTitle}</Text>
            {topicData.map((question, index) => (
                <View key={index} style={styles.card}>
                    <Text style={styles.questionText}>Concept: {question.Title}</Text>
                    <MathText content={question.Example} />
                    {showSolutions[index] && (
                        <View style={styles.solutionContainer}>
                            <Text style={styles.solutionLabel}>Solution:</Text>
                            <MathText content={question.Solution} />
                        </View>
                    )}
                    <TouchableOpacity onPress={() => toggleSolution(index)} style={styles.button}>
                        <Text style={styles.buttonText}>{showSolutions[index] ? "Hide Solution" : "Show Solution"}</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    scrollContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    topicText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    questionText: {
        fontSize: 14,
        fontWeight: '400',
        color: '#86868B',
        marginBottom: 16,
        marginTop: 5,
    },
    mathTextContainer: {
        width: '100%',
        marginVertical: 8,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    regularText: {
        fontSize: 14,
        color: '#333333',
        lineHeight: 22,
    },
    lineBreak: {
        width: '100%',
        height: 0,
    },
    inlineMath: {
        height: 16,
        transform: [{ scale: 0.80 }],
        alignSelf: 'center',
    },
    blockMath: {
        alignSelf: 'center',
        marginVertical: 8,
        height: 18,
        transform: [{ scale: 0.5 }],
        width: '100%',
    },
    solutionContainer: {
        width: '100%',
        marginVertical: 10,
        padding: 12,
        backgroundColor: '#F5F5F7',
        borderRadius: 10,
    },
    solutionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666666',
        marginBottom: 8,
    },
    button: {
        backgroundColor: '#007AFF',
        borderRadius: 15,
        padding: 15,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 15,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
        marginTop: 20,
    },
});

export default QuizScreenCB12;
