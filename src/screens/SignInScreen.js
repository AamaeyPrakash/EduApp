import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native'
import React, { useState, useEffect } from 'react'
import {account} from '../../constants'

const SignInScreen = ({ navigation, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        const checkActiveSession = async () => {
            try {
                const session = await account.getSession('current');
                if (session && onLogin) {
                    // If there's already an active session, refresh the user state
                    onLogin();
                }
            } catch (error) {
                console.log('Error', error.message);
            }
        };
        checkActiveSession();
    }, [onLogin]);
    
    const handleSignIn = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        
        setLoading(true);
        try {
            await account.createEmailPasswordSession(email, password);
            // Call onLogin to refresh the user state in MainNavigator
            if (onLogin) {
                onLogin();
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue learning</Text>
                </View>
                
                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            placeholder='Email'
                            value={email}
                            onChangeText={setEmail}
                            style={styles.input}
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <TextInput
                            placeholder='Password'
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={styles.input}
                            placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            autoCapitalize="none"
                        />
                    </View>
                    
                    <TouchableOpacity 
                        style={[styles.button, loading && styles.buttonDisabled]} 
                        onPress={handleSignIn}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Signing In...' : 'Sign In'}
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('SignUp')}
                        style={styles.linkContainer}
                    >
                        <Text style={styles.linkText}>
                            Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
                        </Text>
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
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'exo',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'exo',
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.35)',
        padding: 16,
        borderRadius: 15,
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: 'exo',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    button: {
        backgroundColor: '#0A84FF',
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
        shadowColor: '#0A84FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: 'rgba(10, 132, 255, 0.5)',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'exo',
        letterSpacing: 0.5,
    },
    linkContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    linkText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        fontFamily: 'exo',
        textAlign: 'center',
    },
    linkTextBold: {
        color: '#0A84FF',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});

export default SignInScreen;