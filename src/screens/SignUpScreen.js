import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
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
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        // Validation
        if (!name.trim() || !age.trim() || !email.trim() || !password.trim() || !educationBoard || !grade.trim() || !school.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        setError('');
        
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
            Alert.alert('Success', 'Account created successfully!', [
                { text: 'OK', onPress: () => navigation.navigate('SignIn') }
            ]);
        } catch (error) {
            console.error('Error', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Join Our Community</Text>
                    <Text style={styles.subtitle}>Create your account to start your learning journey</Text>
                    <Text style={styles.welcomeText}>Master concepts at your own pace</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.section}>                       
                        <View style={styles.inputContainer}>
                            <TextInput
                                placeholder='Full Name'
                                value={name}
                                onChangeText={setName}
                                style={styles.input}
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                placeholder='Age'
                                value={age}
                                onChangeText={setAge}
                                keyboardType='numeric'
                                style={styles.input}
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                maxLength={2}
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                placeholder='Email Address'
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize='none'
                                keyboardType='email-address'
                                style={styles.input}
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                placeholder='Password (min 8 characters)'
                                value={password}
                                onChangeText={setPassword}
                                autoCapitalize='none'
                                secureTextEntry
                                style={styles.input}
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            />
                        </View>
                        <View style={styles.inputContainer}>
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
                                placeholder='Select Education Board'
                                searchPlaceholder="Search boards..."
                                value={educationBoard}
                                onChange={item => setEducationBoard(item.value)}
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                placeholder='Current Grade/Year'
                                value={grade}
                                onChangeText={setGrade}
                                keyboardType='numeric'
                                style={styles.input}
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                maxLength={2}
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <TextInput
                                placeholder='School Name'
                                value={school}
                                onChangeText={setSchool}
                                style={styles.input}
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                            />
                        </View>
                    </View>

                    {error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.error}>❌ {error}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity 
                        style={[styles.button, loading && styles.buttonDisabled]} 
                        onPress={handleSignUp}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={() => navigation.navigate('SignIn')}
                        style={styles.linkContainer}
                    >
                        <Text style={styles.linkText}>
                            Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        paddingTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'exo',
        letterSpacing: -0.5,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'exo',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 22,
    },
    welcomeText: {
        fontSize: 14,
        color: '#0A84FF',
        fontFamily: 'exo',
        fontWeight: '500',
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'exo',
        marginBottom: 12,
        paddingLeft: 4,
    },
    inputContainer: {
        marginBottom: 12,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
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
    dropdown: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        padding: 16,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    placeholderStyle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.5)',
        fontFamily: 'exo',
    },
    inputSearchStyle: {
        fontSize: 16,
        color: '#000000',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
    },
    itemTextStyle: {
        fontSize: 16,
        color: '#000000',
        fontFamily: 'exo',
    },
    dropdownContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    dropdownText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'exo',
    },
    errorContainer: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.3)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    error: {
        color: '#FF3B30',
        fontSize: 14,
        fontFamily: 'exo',
        fontWeight: '500',
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

export default SignUpScreen;