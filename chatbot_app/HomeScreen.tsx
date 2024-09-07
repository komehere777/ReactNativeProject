import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import CONFIG from './config';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from './AuthContext';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

type RootStackParamList = {
  Home: { startNewChat?: boolean };
  History: undefined;
  Profile: undefined;
};

type HomeScreenNavigationProp = BottomTabNavigationProp<RootStackParamList, 'Home'>;
type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyId, setHistoryId] = useState<number | null>(null);
  const { userToken, user } = useAuth();
  
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const route = useRoute<HomeScreenRouteProp>();

  useEffect(() => {
    loadHistoryId();
  }, []);

  useEffect(() => {
    if (route.params?.startNewChat) {
      startNewChat();
      // Reset the parameter
      navigation.setParams({ startNewChat: undefined });
    }
  }, [route.params?.startNewChat, navigation]);

  const loadHistoryId = async () => {
    try {
      const savedHistoryId = await AsyncStorage.getItem('historyId');
      if (savedHistoryId !== null) {
        setHistoryId(parseInt(savedHistoryId, 10));
      }
    } catch (e) {
      console.error('Failed to load historyId');
    }
  };

  const saveHistoryId = async (id: number) => {
    try {
      await AsyncStorage.setItem('historyId', id.toString());
    } catch (e) {
      console.error('Failed to save historyId');
    }
  };

  const startNewChat = async () => {
    setMessages([]);
    setHistoryId(null);
    await AsyncStorage.removeItem('historyId');
  };

  const sendMessage = async () => {
    if (inputText.trim() === '') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
    };

    setMessages((prevMessages) => [newMessage, ...prevMessages]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(`${CONFIG.API_URL}/get_response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`, // JWT 토큰을 헤더에 추가
        },
        body: JSON.stringify({ 
          message: newMessage.text,
          history_id: historyId,
          username: user?.username // 실제 사용자 이름 사용
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
      };

      setMessages((prevMessages) => [aiResponse, ...prevMessages]);

      // 새로운 historyId 저장
      if (data.history_id) {
        const newHistoryId = parseInt(data.history_id, 10);
        setHistoryId(newHistoryId);
        saveHistoryId(newHistoryId);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        isUser: false,
      };
      setMessages((prevMessages) => [errorMessage, ...prevMessages]);
      Alert.alert("오류", errorMessage.text);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.isUser ? styles.userMessage : styles.aiMessage]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        inverted
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="메시지를 입력하세요..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#007AFF" />
          ) : (
            <Ionicons name="send" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  newChatButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  newChatButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageList: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 20,
    marginVertical: 5,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    color: '#000',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});