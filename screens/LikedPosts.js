import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LikedPosts = ({ navigation }) => {
  const [likedPosts, setLikedPosts] = useState([]);

  useEffect(() => {
    loadLikedPosts();
  }, []);

  const loadLikedPosts = async () => {
    try {
      const likedPostIds = await AsyncStorage.getItem("likedPosts");
      const parsedLikedPosts = likedPostIds ? JSON.parse(likedPostIds) : [];

      // 서버나 로컬 데이터베이스에서 좋아요한 게시물의 전체 정보를 가져옵니다
      // 예시: API 호출이나 데이터베이스 쿼리
      const postsData = await fetchPostsByIds(parsedLikedPosts);
      setLikedPosts(postsData);
    } catch (error) {
      console.error("좋아요 게시글 로딩 에러:", error);
    }
  };

  // 게시물 ID 배열로 전체 게시물 정보를 가져오는 함수
  const fetchPostsByIds = async (postIds) => {
    try {
      // 여기에 실제 API 호출 또는 데이터베이스 쿼리 로직을 구현하세요
      // 예시 코드:
      // const response = await fetch(`your-api-url/posts?ids=${postIds.join(',')}`);
      // const data = await response.json();
      // return data;

      // 임시 더미 데이터 반환
      return postIds.map((id) => ({
        id,
        title: `게시물 ${id}`,
        content: "게시물 내용...",
        image: "https://example.com/image.jpg",
        date: `${new Date()}`,
        likes: 10,
      }));
    } catch (error) {
      console.error("게시물 데이터 가져오기 에러:", error);
      return [];
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.postItem}
      onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      )}
      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postDescription} numberOfLines={2}>
          {item.content}
        </Text>
        <View style={styles.postInfo}>
          <Text style={styles.postDate}>{item.date}</Text>
          <Text style={styles.postLikes}>좋아요 {item.likes}</Text>
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
          keyExtractor={(item) => String(item?.id || Math.random())}
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
