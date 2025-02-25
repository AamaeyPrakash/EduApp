import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { account, databases, database1Id, UserAccountsId } from '../../constants';
import { Dropdown } from 'react-native-element-dropdown';

const educationBoardData = [
    { label: 'CBSE', value: '1' },
    { label: 'IGCSE', value: '2' },
    { label: 'GCSE', value: '3' },
    { label: 'MYP', value: '4' },
    { label: 'IB', value: '5' },
    { label: 'A Levels or AS', value: '6' },
];

const SignUpScreen = ({navigation}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [grade, setGrade] = useState('');
    const [school, setSchool] = useState('');
    const [educationBoard, setEducationBoard] = useState('');
    const [error, setError] = useState('');

    const handleSignUp = async () => {
        try {
            const user = await account.create("unique()", email, password);
            const userInfo = {
                userId: user.$id,
                email: email,
                name: name,
                age: age,
                grade: grade,
                school: school,
                educationBoard: educationBoard,
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
        <View style={styles.container}>
            <TextInput
                placeholder='Name'
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholderTextColor="#666"
            />
            <TextInput
                placeholder='Age'
                value={age}
                onChangeText={setAge}
                keyboardType='numeric'
                style={styles.input}
                placeholderTextColor="#666"
            />
            <TextInput
                placeholder='Email'
                value={email}
                onChangeText={setEmail}
                autoCapitalize='none'
                style={styles.input}
                placeholderTextColor="#666"
            />
            <TextInput
                placeholder='Password'
                value={password}
                onChangeText={setPassword}
                autoCapitalize='none'
                secureTextEntry
                style={styles.input}
                placeholderTextColor="#666"
            />
            <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                inputSearchStyle={styles.inputSearchStyle}
                itemTextStyle={styles.itemTextStyle}
                containerStyle={styles.dropdownContainer}
                selectedTextStyle={styles.dropdownText}
                data={educationBoardData}
                search
                labelField="label"
                valueField="value"
                placeholder='Education Board'
                searchPlaceholder="Search..."
                value={educationBoard}
                onChange={item => setEducationBoard(item.value)}
            />
            <TextInput
                placeholder='Grade'
                value={grade}
                onChangeText={setGrade}
                keyboardType='numeric'
                style={styles.input}
                placeholderTextColor="#666"
            />
            <TextInput
                placeholder='School'
                value={school}
                onChangeText={setSchool}
                style={styles.input}
                placeholderTextColor="#666"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                <Text style={styles.linkText}>Already have an account? Sign Up</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#F0F4F8',
    },
    input: {
        backgroundColor: '#FFF',
        padding: 14,
        borderRadius: 8,
        marginVertical: 8,
        fontSize: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
        color:'#666'
    },
    dropdown: {
        backgroundColor: '#FFF',
        padding: 14,
        borderRadius: 8,
        marginVertical: 8,
        fontSize: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
        color:'black',
        zIndex:999
    },
    placeholderStyle: {
        fontSize: 16,
        color: '#666',
    },
    inputSearchStyle: {
        fontSize: 16,
        color:'#666'
    },
    itemTextStyle: {
        fontSize: 16,
        color: '#666', 
    },
    dropdownContainer: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        elevation: 2,
        color:'#666'
    },
    dropdownText: {
        color:'#666',
    },
    error: {
        color: 'red',
        fontSize: 14,
        marginTop: 5,
    },
    button: {
        backgroundColor: '#3B82F6',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 10,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkText: {
        color: '#3B82F6',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 20,
        textDecorationLine: 'underline',
    },
});

export default SignUpScreen;
