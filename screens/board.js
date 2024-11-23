import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import BottomNavigation from "../components/BottomNavigation";

const Board = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState("전체");
  const isFocused = useIsFocused();
  const [likedPosts, setLikedPosts] = useState(new Set());

  // 게시글 불러오기
  const loadPosts = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      console.log("1. 사용중인 JWT 토큰:", jwtToken);

      if (!jwtToken) {
        console.log("JWT 토큰이 없습니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      const baseUrl = "http://192.168.61.45:8080/api/posts";
      console.log("2. 요청 URL:", baseUrl);

      const response = await fetch(baseUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      console.log("3. 서버 응답 상태:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          console.log("인증 오류 발생");
          navigation.navigate("KakaoLogin");
          return;
        }
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const responseText = await response.text();
      console.log("4. 서버 응답 원본:", responseText);

      const data = JSON.parse(responseText);
      console.log("5. 파싱된 데이터:", data);

      // 서버에서 받은 데이터에 nickname이 포함되어 있는지 확인
      if (Array.isArray(data)) {
        console.log("게시글 데이터 예시:", data[0]); // 첫 번째 게시글 데이터 로깅
        setPosts(data);
      } else if (data.content && Array.isArray(data.content)) {
        console.log("게시글 데이터 예시:", data.content[0]); // 첫 번째 게시글 데이터 로깅
        setPosts(data.content);
      }

      console.log("9. 최종 설정된 posts 길이:", posts.length);
    } catch (error) {
      console.error("게시글 로딩 중 오류 발생:", error);
      Alert.alert("게시글 로딩 실패", "게시글을 불러오는데 실패했습니다.");
    }
  };

  // 좋아요 상태 불러오기
  const loadLikedPosts = async () => {
    try {
      const savedLikedPosts = await AsyncStorage.getItem("likedPosts");
      if (savedLikedPosts) {
        setLikedPosts(new Set(JSON.parse(savedLikedPosts)));
      }
    } catch (error) {
      console.error("좋아요 상태 로딩 에러:", error);
    }
  };

  // 게시글과 좋아요 상태 불러오기
  useEffect(() => {
    if (isFocused) {
      loadPosts();
      loadLikedPosts();
    }
  }, [isFocused]);

  // 좋아요 토글 함수 수정
  const toggleLike = async (postId) => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");

      if (!jwtToken) {
        Alert.alert("오류", "로그인이 필요합니다.");
        return;
      }

      const response = await fetch(
        `http://192.168.61.45:8080/api/postLikes/${postId}/likes/toggle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("좋아요 실패 응답:", errorData);

        if (response.status === 401) {
          Alert.alert("오류", "로그인이 만료되었습니다. 다시 로그인해주세요.");
          navigation.navigate("KakaoLogin");
          return;
        }

        throw new Error(`좋아요 업데이트 실패 (${response.status})`);
      }

      // 성공 시에만 게시글 목록 새로고침
      await loadPosts();
    } catch (error) {
      console.error("좋아요 업데이트 에러:", error);
      Alert.alert("오류", "좋아요 업데이트에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 검색과 태그 필터링
  const filteredPosts = posts.filter((post) => {
    if (!post || !post.title) return false;

    const matchesSearch = post.title
      .toLowerCase()
      .includes(searchText.toLowerCase());

    const matchesTag =
      selectedTag === "전체" ||
      (post.tags &&
        Array.isArray(post.tags) &&
        post.tags.includes(selectedTag.replace("#", "")));

    return matchesSearch && matchesTag;
  });

  // 게시글 렌더링
  const renderItem = ({ item }) => {
    if (!item || !item.postId || !item.title) return null;

    // 날짜 포맷팅 함수 수정
    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}.${month}.${day}`;
    };

    return (
      <TouchableOpacity
        style={styles.postItem}
        onPress={() =>
          navigation.navigate("PostDetail", { postId: item.postId })
        }
      >
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.tagContainer}>
          {(item.tags || []).map((tag, index) => (
            <Text key={index} style={styles.tag}>
              #{tag}
            </Text>
          ))}
        </View>
        <View style={styles.postInfo}>
          <View style={styles.leftInfo}>
            <Text style={styles.author}>{item.nickname || "알 수 없음"}</Text>
            <Text style={styles.date}>{formatDate(item.updatedAt)}</Text>
          </View>
          <View style={styles.interactionContainer}>
            <View style={styles.interactionButton}>
              <Icon name="chat-bubble-outline" size={20} color="#666" />
              <Text style={styles.interactionText}>
                {item.commentCount || 0}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.interactionButton}
              onPress={() => toggleLike(item.postId)}
            >
              <Icon
                name={item.isLiked ? "favorite" : "favorite-border"}
                size={20}
                color={item.isLiked ? "#ff6b6b" : "#666"}
              />
              <Text style={styles.interactionText}>{item.likeCount || 0}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>게시판</Text>
        </View>

        {/* 검색창 */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="검색어를 입력하세요"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* 태그 필터 */}
        <View style={styles.tagFilterContainer}>
          {["전체", "#정보", "#조언", "#나눔"].map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tagButton,
                selectedTag === tag && styles.selectedTagButton,
              ]}
              onPress={() => setSelectedTag(tag)}
            >
              <Text
                style={[
                  styles.tagText,
                  selectedTag === tag && styles.selectedTagText,
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredPosts}
          renderItem={renderItem}
          keyExtractor={(item) => item.postId.toString()}
          contentContainerStyle={styles.listContainer}
        />

        <TouchableOpacity
          style={styles.writeButton}
          onPress={() => navigation.navigate("boardNew")}
        >
          <Text style={styles.writeButtonText}>+글쓰기</Text>
        </TouchableOpacity>
      </View>

      <BottomNavigation navigation={navigation} currentRoute="board" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
    marginTop: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  tagFilterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f5f5f5",
  },
  selectedTagButton: {
    backgroundColor: "#FFEDAE",
  },
  tagText: {
    fontSize: 14,
    color: "#666",
  },
  selectedTagText: {
    color: "#000",
    fontWeight: "bold",
  },
  postItem: {
    padding: 16,
    backgroundColor: "#F4F4F4",
    borderRadius: 10,
    marginBottom: 30,
    width: "90%",
    alignSelf: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  postInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
  },
  leftInfo: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 5,
  },
  author: {
    color: "black",
  },
  date: {
    color: "#666",
  },
  writeButton: {
    position: "absolute",
    right: 20,
    bottom: 50,
    backgroundColor: "#FFEDAE",
    padding: 16,
    borderRadius: 30,
  },
  writeButtonText: {
    color: "black",
    fontWeight: "bold",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  tag: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "#FFEDAE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    padding: 16,
  },
  interactionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  interactionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  interactionText: {
    fontSize: 14,
    color: "#666",
  },
});

export default Board;
