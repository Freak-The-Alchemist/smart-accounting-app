import React, { useEffect, useState } from 'react';
import { View, Button, Text, ScrollView, Platform, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Speech from 'expo-speech';
import Tesseract from 'tesseract.js';
import ExcelJS from 'exceljs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { auth } from '../shared/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

// Types
type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Auth Screen Component
const AuthScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleAuth = async () => {
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === 'login' ? 'Login' : 'Sign Up'}</Text>
      <TextInput
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
        style={styles.input}
      />
      <Button title={mode === 'login' ? "Log In" : "Sign Up"} onPress={handleAuth} />
      <Text
        onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
        style={styles.switchText}
      >
        {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
      </Text>
    </View>
  );
};

// Home Screen Component
const HomeScreen = () => {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [excelSaved, setExcelSaved] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      const worker = await Tesseract.createWorker('eng');
      const { data } = await worker.recognize(result.assets[0].uri);
      setText(data.text);
      await worker.terminate();
    }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("ExtractedData");

    const lines = text.split('\n');
    lines.forEach((line) => {
      sheet.addRow([line]);
    });

    const fileUri = FileSystem.documentDirectory + "accounting.xlsx";
    const buffer = await workbook.xlsx.writeBuffer();

    await FileSystem.writeAsStringAsync(fileUri, buffer.toString('base64'), {
      encoding: FileSystem.EncodingType.Base64,
    });

    setExcelSaved(true);
    alert("Excel saved!");
  };

  const speakText = () => {
    if (text) {
      Speech.speak(text);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.welcomeText}>Welcome, {auth.currentUser?.email}</Text>
      
      <View style={styles.section}>
        <Button title="Pick Image for OCR" onPress={pickImage} />
        {image && (
          <Image source={{ uri: image }} style={styles.image} />
        )}
        <Text selectable style={styles.text}>{text}</Text>
        {text.length > 0 && (
          <>
            <Button title="Read Out Extracted Text" onPress={speakText} />
            <Button title="Export to Excel" onPress={exportToExcel} />
          </>
        )}
        {excelSaved && <Text style={styles.successText}>✅ Excel file saved locally</Text>}
      </View>
    </ScrollView>
  );
};

// Main App Component
export default function App() {
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUser(user));
    return () => unsubscribe();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <Stack.Screen name="Home" component={HomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  switchText: {
    color: 'blue',
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 18,
    marginBottom: 20,
  },
  section: {
    marginVertical: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 10,
    alignSelf: 'center',
  },
  text: {
    marginVertical: 10,
  },
  successText: {
    color: 'green',
    marginTop: 10,
  },
}); 