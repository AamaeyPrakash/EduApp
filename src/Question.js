import { View, Text, FlatList } from 'react-native'
import React from 'react'
import AlgebraQs from "./Questions/AlgebraQuestions.json";


const Question = () => {
    
    const mathQuestionList = ({item}) => (
        <View>
      <Text>{item.question}</Text>
      <Text></Text>
    </View>
    );
  return (
   <FlatList data={AlgebraQs} renderItem={mathQuestionList} keyExtractor={(item, index) => index.toString()}/>
  )
}

export default Question