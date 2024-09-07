import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './HomeScreen';
import HistoryScreen from './HistoryScreen';
import ProfileScreen from './ProfileScreen';
import ChatDetailScreen from './ChatDetailScreen';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import { AuthProvider, useAuth } from './AuthContext';

// 네비게이션 파라미터 타입 정의
type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ChatDetail: { historyId: number };
};

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type MainTabParamList = {
  Home: { startNewChat?: boolean };
  History: { refresh?: number };
  Profile: undefined;
};

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function AuthScreens() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      <AuthStack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ headerTitle: "Register" }}
      />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'alert-circle';

          if (route.name === 'Home') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <MainTab.Screen 
        name="Home" 
        component={HomeScreen}
        options={({ navigation }) => ({
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.setParams({ startNewChat: true })}
              style={styles.headerButton}
            >
              <Text style={styles.newChatButtonText}>새 채팅</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <MainTab.Screen 
        name="History" 
        component={HistoryScreen}
        options={({ navigation }) => ({
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.setParams({ refresh: Date.now() })}
              style={styles.headerButton}
            >
              <Ionicons name="refresh" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        })}
      />
      <MainTab.Screen name="Profile" component={ProfileScreen} />
    </MainTab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <RootStack.Navigator>
      {isAuthenticated ? (
        <>
          <RootStack.Screen 
            name="Main" 
            component={MainTabs} 
            options={{ headerShown: false }}
          />
          <RootStack.Screen 
            name="ChatDetail" 
            component={ChatDetailScreen}
            options={{ headerTitle: "Chat Detail" }}
          />
        </>
      ) : (
        <RootStack.Screen 
          name="Auth" 
          component={AuthScreens}
          options={{ headerShown: false }}
        />
      )}
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginRight: 15,
  },
  newChatButtonText: {
    color: 'red',
    fontSize: 16,
  },
});