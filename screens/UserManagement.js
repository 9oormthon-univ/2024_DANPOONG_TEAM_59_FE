import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserManagement = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await AsyncStorage.getItem("allUsers");
      if (allUsers) {
        setUsers(JSON.parse(allUsers));
      }
    } catch (error) {
      console.error("사용자 목록 로딩 에러:", error);
    }
  };

  const handleUserAction = (user) => {
    Alert.alert("사용자 관리", `${user.nickname}님에 대한 작업을 선택하세요`, [
      {
        text: "게시글 보기",
        onPress: () => viewUserPosts(user),
      },
      {
        text: "계정 정지",
        style: "destructive",
        onPress: () => handleBanUser(user),
      },
      {
        text: "취소",
        style: "cancel",
      },
    ]);
  };

  const viewUserPosts = async (user) => {
    try {
      const posts = await AsyncStorage.getItem("posts");
      if (posts) {
        const userPosts = JSON.parse(posts).filter(
          (post) => post.memberId === user.id
        );
        // Navigate to a screen showing user's posts
        // navigation.navigate('UserPosts', { posts: userPosts });
      }
    } catch (error) {
      console.error("사용자 게시글 로딩 에러:", error);
    }
  };

  const handleBanUser = async (user) => {
    Alert.alert("계정 정지", `${user.nickname}님의 계정을 정지하시겠습니까?`, [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "정지",
        style: "destructive",
        onPress: async () => {
          try {
            // 실제 구현에서는 사용자 상태를 'banned'로 변경하는 로직 추가
            Alert.alert("성공", "계정이 정지되었습니다.");
          } catch (error) {
            console.error("사용자 정지 에러:", error);
            Alert.alert("오류", "계정 정지 중 문제가 발생했습니다.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => handleUserAction(item)}
          >
            <Text style={styles.userName}>{item.nickname}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userStatus}>
              상태: {item.status === "banned" ? "정지됨" : "활성"}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  userItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  userStatus: {
    fontSize: 14,
    color: "#FF6B6B",
    marginTop: 5,
  },
});

export default UserManagement;
