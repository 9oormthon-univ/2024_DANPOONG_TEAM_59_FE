import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = "http://3.34.96.14:8080";

const LikedPosts = ({ navigation }) => {
  const [likedPosts, setLikedPosts] = useState([]);

  useEffect(() => {
    loadLikedPosts();
  }, []);

  const loadLikedPosts = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      console.log("토큰:", token);

      if (!token) {
        Alert.alert("오류", "로그인이 필요합니다.");
        navigation.navigate("Login");
        return;
      }

      const response = await fetch(`${API_URL}/api/member`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("응답 상태:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("서버 에러 응답:", errorText);
        throw new Error("좋아요 목록을 가져오는데 실패했습니다.");
      }

      const data = await response.json();
      console.log("받은 데이터:", data);

      if (data.length === 0) {
        Alert.alert("알림", "좋아요 한 글이 없습니다.", [
          {
            text: "확인",
            onPress: () => navigation.goBack(),
          },
        ]);
        return;
      }
      setLikedPosts(data);
    } catch (error) {
      console.error("좋아요 한 글 로딩 에러:", error);
      Alert.alert("오류", "좋아요 한 글을 불러오는데 실패했습니다.");
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.postItem}
      onPress={() => navigation.navigate("PostDetail", { postId: item.postId })}
    >
      {item.imageUrls && item.imageUrls.length > 0 && (
        <Image source={{ uri: item.imageUrls[0] }} style={styles.postImage} />
      )}
      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postDescription} numberOfLines={2}>
          {item.content}
        </Text>
        <View style={styles.postInfo}>
          <Text style={styles.postDate}>
            {new Date(item.updatedAt).toLocaleDateString()}
          </Text>
          <Text style={styles.postLikes}>좋아요 {item.likeCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>좋아요 한 글</Text>
        <View style={styles.placeholder} />
      </View>

      {likedPosts.length > 0 ? (
        <FlatList
          data={likedPosts}
          renderItem={renderItem}
          keyExtractor={(item) => String(item?.postId || Math.random())}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>좋아요 한 글이 없습니다.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  backButton: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  placeholder: {
    flex: 1,
  },
  listContainer: {
    padding: 10,
  },
  postItem: {
    flexDirection: "row",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  postImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  postContent: {
    flex: 1,
    padding: 10,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  postDescription: {
    fontSize: 14,
    color: "#333",
  },
  postInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  postDate: {
    fontSize: 12,
    color: "#666",
  },
  postLikes: {
    fontSize: 12,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#333",
  },
});

export default LikedPosts;
