import React, { useState, useEffect, useCallback, memo } from "react";
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

// PostItem 컴포넌트 분리 및 메모이제이션
const PostItem = memo(({ item, activeTab, onPress }) => (
  <TouchableOpacity style={styles.postItem} onPress={onPress}>
    {activeTab === "care" && item.imageUrls && item.imageUrls.length > 0 ? (
      <Image source={{ uri: item.imageUrls[0] }} style={styles.postImage} />
    ) : (
      item.image && (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      )
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
        <View style={styles.infoContainer}>
          {activeTab === "care" && item.isEmergency && (
            <Text style={styles.emergencyTag}>긴급</Text>
          )}
          <Text style={styles.postLikes}>좋아요 {item.likeCount || 0}</Text>
          <Text style={styles.postComments}>댓글 {item.commentCount || 0}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
));

// Tab 버튼 컴포넌트 분리 및 메모이제이션
const TabButton = memo(({ title, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.tagContainer, isActive && styles.activeTag]}
    onPress={onPress}
  >
    <Text style={styles.tag}>{title}</Text>
  </TouchableOpacity>
));

const WrittenPost = ({ navigation }) => {
  const [userPosts, setUserPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("written");
  const [isLoading, setIsLoading] = useState(false);

  // API 호출 함수 메모이제이션
  const loadPosts = useCallback(
    async (type) => {
      if (isLoading) return;

      setIsLoading(true);
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (!token) {
          setUserPosts([]);
          return;
        }

        // 탭에 따라 다른 API 엔드포인트 사용
        const endpoint =
          type === "written"
            ? "http://3.34.96.14:8080/api/member/posts"
            : "http://3.34.96.14:8080/api/member/care";

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("서버 응답 오류");
        }

        const data = await response.json();
        setUserPosts(data);

        if (data.length === 0) {
          Alert.alert(
            "알림",
            type === "written"
              ? "내가 쓴 글이 없습니다."
              : "돌봄 작성글이 없습니다."
          );
        }
      } catch (error) {
        console.error("게시글 로딩 에러:", error);
        Alert.alert("오류", "게시글을 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  // 탭 변경 핸들러 메모이제이션
  const handleTabChange = useCallback(
    (type) => {
      setActiveTab(type);
      loadPosts(type);
    },
    [loadPosts]
  );

  // 게시글 클릭 핸들러 메모이제이션
  const handlePostPress = useCallback(
    (item) => {
      if (activeTab === "written") {
        navigation.navigate("PostDetail", { postId: item.postId });
      } else {
        navigation.navigate("ChildCareDetail", { carePostId: item.carePostId });
      }
    },
    [navigation, activeTab]
  );

  // renderItem 메모이제이션
  const renderItem = useCallback(
    ({ item }) => (
      <PostItem
        item={item}
        activeTab={activeTab}
        onPress={() => handlePostPress(item)}
      />
    ),
    [activeTab, handlePostPress]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TabButton
          title="내가 쓴 글"
          isActive={activeTab === "written"}
          onPress={() => handleTabChange("written")}
        />
        <View style={styles.spacer} />
        <TabButton
          title="돌봄 작성글"
          isActive={activeTab === "care"}
          onPress={() => handleTabChange("care")}
        />
      </View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text>로딩 중...</Text>
        </View>
      ) : userPosts.length > 0 ? (
        <FlatList
          data={userPosts}
          renderItem={renderItem}
          keyExtractor={(item) =>
            String(activeTab === "written" ? item.postId : item.carePostId)
          }
          contentContainerStyle={styles.listContainer}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>작성한 글이 없습니다.</Text>
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  spacer: {
    flex: 1,
  },
  tagContainer: {
    backgroundColor: "#007AFF",
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 12,
    opacity: 0.6,
  },
  activeTag: {
    opacity: 1,
  },
  tag: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emergencyTag: {
    backgroundColor: "#FF4444",
    color: "white",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    marginRight: 8,
  },
  postComments: {
    fontSize: 12,
    color: "#666",
  },
});

export default memo(WrittenPost);
