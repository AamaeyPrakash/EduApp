import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import MathView from 'react-native-math-view';
import CBSEMath12 from '../mathTopics/CBSEMath12.json';

const MathText = ({ content }) => {
    // Split content by LaTeX delimiters
    const parts = content.split(/(\$\$.*?\$\$|\$.*?\$)/g);
    
    return (
        <View style={styles.mathTextContainer}>
            {parts.map((part, index) => {
                if (part.startsWith('$$') && part.endsWith('$$')) {
                    // Display block math
                    const math = part.slice(2, -2);
                    return (
                        <MathView
                            key={index}
                            math={math}
                            style={styles.blockMath}
                        />
                    );
                } else if (part.startsWith('$') && part.endsWith('$')) {
                    // Display inline math
                    const math = part.slice(1, -1);
                    return (
                        <MathView
                            key={index}
                            math={math}
                            style={styles.inlineMath}
                        />
                    );
                } else {
                    // Display regular text
                    return <Text key={index} style={styles.regularText}>{part}</Text>;
                }
            })}
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
                        <MathText content={question.Solution} />
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
        alignItems: 'center',
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
    },
    regularText: {
        fontSize: 16,
        color: '#333333',
        lineHeight: 24,
    },
    inlineMath: {
        marginHorizontal: 4,
    },
    blockMath: {
        alignSelf: 'center',
        marginVertical: 8,
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
    }
});

export default QuizScreenCB12;
