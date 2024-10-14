import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import {account} from '../../constants'

const SignInScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const checkActiveSession = async () => {
            try {
                const session = await account.getSession('current');
                if (session) {
                    navigation.navigate('Prompt'); 
                }
            } catch (error) {
                Alert.alert('Error', error.message);
            }
        };
        checkActiveSession();
    }, []);

    const handleSignIn = async () => {
        try {
            await account.createEmailPasswordSession(email, password);
            navigation.navigate();
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        <View style={styles.container}>
            <TextInput
                placeholder='Email'
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                placeholderTextColor="#666"
                autoCapitalize="none"
            />
            <TextInput
                placeholder='Password'
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                placeholderTextColor="#666"
                autoCapitalize="none"
            />

            <TouchableOpacity style={styles.button} onPress={handleSignIn}>
                <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: '#F5F5F5',
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
        color:'black'
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

export default SignInScreen;
