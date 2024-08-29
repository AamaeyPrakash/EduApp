import { View, Text, TextInput } from 'react-native'
import React, { useState } from 'react'

const SummarizerComponent = () => {
    const [text, setText] = useState('');
    const [summary, setSummary] = useState('');

    const summarizeText = () => {
        
    }

    return (
        <View>
            <TextInput 
                placeholder='Enter Question Here'
                value={text}
                onChange={setText}
            />
            <Button title="Get Questions" onPress={summarizeText} />
            <Text>Your Question: {summary}</Text>
        </View>
    )
}

export default SummarizerComponent