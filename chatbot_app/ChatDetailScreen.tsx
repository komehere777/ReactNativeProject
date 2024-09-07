import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext'; // Import useAuth hook
import CONFIG from './config';

type RootStackParamList = {
  ChatDetail: { historyId: number };
};

type ChatDetailScreenRouteProp = RouteProp<RootStackParamList, 'ChatDetail'>;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface ChatDetailScreenProps {
  route: ChatDetailScreenRouteProp;
}

export default function ChatDetailScreen({ route }: ChatDetailScreenProps) {
  const { historyId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const { userToken, user } = useAuth(); // Use the useAuth hook to get the userToken and user

  useEffect(() => {
    fetchChatDetail();
  }, []);

  const fetchChatDetail = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${CONFIG.API_URL}/history/${historyId}`, {
        headers: { Authorization: `Bearer ${userToken}` }, // Add JWT token to the request
        withCredentials: true
      });
      const formattedMessages = response.data.chat.flatMap((msg: any, index: number) => [
        {
          id: `${index}-user`,
          text: msg.user,
          isUser: true
        },
        {
          id: `${index}-ai`,
          text: msg.ai,
          isUser: false
        }
      ]);
      setMessages(formattedMessages.reverse());
    } catch (error) {
      console.error('채팅 내역을 불러오는 중 오류 발생:', error);
      // TODO: 오류 처리 (예: 알림 표시)
    } finally {
      setIsLoading(false);
    }
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
      const response = await axios.post(`${CONFIG.API_URL}/get_response`, {
        message: newMessage.text,
        history_id: historyId,
        username: user?.username // Use the username from the auth context
      }, {
        headers: { Authorization: `Bearer ${userToken}` }, // Add JWT token to the request
        withCredentials: true
      });

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        isUser: false,
      };

      setMessages((prevMessages) => [aiResponse, ...prevMessages]);
    } catch (error) {
      console.error('메시지 전송 중 오류 발생:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "죄송합니다. 메시지를 처리하는 동안 오류가 발생했습니다.",
        isUser: false,
      };
      setMessages((prevMessages) => [errorMessage, ...prevMessages]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.isUser ? styles.userMessage : styles.aiMessage]}>
      <Text style={[styles.messageText, item.isUser ? styles.userMessageText : styles.aiMessageText]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <FlatList
        ref={flatListRef}
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
        <TouchableOpacity 
          onPress={() => !isLoading && sendMessage()} 
          style={[styles.sendButton, isLoading && styles.disabledButton]}
        >
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
    fontSize: 16,
  },
  userMessageText: {
    color: '#FFF',
  },
  aiMessageText: {
    color: '#000',
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
  disabledButton: {
    opacity: 0.5,
  },
});