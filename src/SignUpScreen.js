import { View, Text, TextInput, Button } from 'react-native'
import React, { useState } from 'react'
import {account, databases, database1Id, UserAccountsId} from '../constants'

const SignUpScreen = () => {
    const [name, setName] = useState ('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [grade, setGrade] = useState('');
    const [error, setError] = useState('');

    const handleSignUp = async() => {
        try {
            const user = await account.create("unique()", email, password)
            const userInfo = {
                userId: user.$id,
                name: name,
                email: email,
                grade: grade,
            };
            await databases.createDocument(
                database1Id,
                UserAccountsId, 
                user.$id,
                userInfo
            );
        } catch (error) {
            console.error('Error', error);
            setError(error.message);
        }
    };

  return (
    <View>
        <TextInput 
            placeholder='Name'
            value={name}
            onChangeText={setName}
        />
        <TextInput
            placeholder='Email'
            value={email}
            onChangeText={setEmail}
        />
        <TextInput 
            placeholder='Password'
            value={password}
            onChangeText={setPassword}
            secureTextEntry
        />
        <TextInput
            placeholder='Grade'
            value={grade}
            onChangeText={setGrade}
            keyboardType='numeric'
        />
        {error ? <Text>{error}</Text> : null}
        <Button title='Create Account' onPress={handleSignUp}/>
    </View>
  )
}

export default SignUpScreen