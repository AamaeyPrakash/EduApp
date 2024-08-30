import { View, Text, TextInput, Button } from 'react-native'
import React, { useState } from 'react'
import generateGPTQuestion from './gptService'

const PromptScreen = () => {
    const [prompt, setPrompt] = useState('');
    const [answer, setAnswer] = useState(null);
    const handleSend = async() =>{
        const result = await generateGPTQuestion(prompt);
        setAnswer(result);
    }
  return (
    <View>
        <TextInput placeholder='What is your question?' value={prompt} onChangeText={setPrompt}/>
        <Button title='Ask Question' onPress={handleSend}/>
        {answer ? (<Text>{result}</Text>): (<Text>Write a prompt</Text>)}
    </View>
  )
}

export default PromptScreen