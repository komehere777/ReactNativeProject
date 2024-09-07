import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from './AuthContext';
import axios from 'axios';

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ChatDetail: { historyId: number };
};

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, logout, deleteAccount, fetchUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        await fetchUserData();
      } catch (err) {
        console.error('Error fetching user data:', err);
        if (axios.isAxiosError(err)) {
          if (err.response) {
            Alert.alert('오류', `데이터 불러오기 실패: ${err.response.status} - ${err.response.data.message || '알 수 없는 오류'}`);
          } else if (err.request) {
            Alert.alert('오류', '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
          } else {
            Alert.alert('오류', '요청 설정 중 오류가 발생했습니다.');
          }
        } else {
          Alert.alert('오류', '알 수 없는 오류가 발생했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []); // 빈 의존성 배열로 컴포넌트 마운트 시 한 번만 실행

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate('Auth');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('로그아웃 실패', '로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "계정 탈퇴",
      "정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "삭제", 
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAccount();
              navigation.navigate('Auth');
            } catch (error) {
              Alert.alert("오류", "계정 삭제 중 문제가 발생했습니다.");
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>사용자 프로필</Text>
      <Text style={styles.info}>이메일: {user?.email}</Text>
      <Text style={styles.info}>사용자 이름: {user?.username}</Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteAccount}
        disabled={isDeleting}
      >
        <Text style={styles.deleteButtonText}>
          {isDeleting ? "처리 중..." : "계정 탈퇴"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  info: {
    fontSize: 18,
    marginBottom: 10,
  },
  logoutButton: {
    marginRight: 10,
  },
  logoutButtonText: {
    color: 'red',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
  },
});