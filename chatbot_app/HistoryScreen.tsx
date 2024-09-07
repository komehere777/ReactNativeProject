import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from './AuthContext'; // Import useAuth hook
import CONFIG from './config';

interface ChatItem {
  history_id: number;
  chat: { user: string; ai: string }[];
}

type RootStackParamList = {
  Home: undefined;
  History: { refresh?: number };
  Profile: undefined;
  ChatDetail: { historyId: number };
};

type HistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'History'>;
type HistoryScreenRouteProp = RouteProp<RootStackParamList, 'History'>;

export default function HistoryScreen() {
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  const route = useRoute<HistoryScreenRouteProp>();
  const { userToken } = useAuth(); // Use the useAuth hook to get the userToken

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    if (route.params?.refresh) {
      fetchChatHistory();
    }
  }, [route.params?.refresh]);

  const fetchChatHistory = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${CONFIG.API_URL}/history`, {
        headers: { Authorization: `Bearer ${userToken}` }, // Add JWT token to the request
        withCredentials: true
      });
      setChatHistory(response.data.chat_history);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      Alert.alert('Error', 'Failed to fetch chat history');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (historyId: number) => {
    try {
      const response = await axios.delete(`${CONFIG.API_URL}/delete_chat/${historyId}`, {
        headers: { Authorization: `Bearer ${userToken}` }, // Add JWT token to the request
        withCredentials: true
      });
      if (response.data.success) {
        setChatHistory(chatHistory.filter(item => item.history_id !== historyId));
      } else {
        Alert.alert('Error', 'Failed to delete chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      Alert.alert('Error', 'Failed to delete chat');
    }
  };

  const renderItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity 
      style={styles.listItem}
      onPress={() => navigation.navigate('ChatDetail', { historyId: item.history_id })}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemText} numberOfLines={1}>
          {item.chat[0].user.length > 15
            ? `${item.chat[0].user.substring(0, 15)}...`
            : item.chat[0].user}
        </Text>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Delete Chat',
              'Are you sure you want to delete this chat?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', onPress: () => deleteChat(item.history_id) }
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={24} color="#6c757d" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chatHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.history_id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={isLoading}
        onRefresh={fetchChatHistory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 15,
  },
  listItem: {
    backgroundColor: '#343a40',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#6c757d',
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  itemText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
});