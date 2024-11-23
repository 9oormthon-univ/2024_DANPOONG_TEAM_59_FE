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
      const savedPosts = await AsyncStorage.getItem("posts");
      if (savedPosts) {
        setPosts(JSON.parse(savedPosts));
      }
    } catch (error) {
      console.error("게시글 로딩 에러:", error);
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

  // 좋아요 토글 함수
  const toggleLike = async (postId) => {
    try {
      const updatedPosts = posts.map((post) => {
        if (post.id === postId) {
          // 이미 좋아요를 눌렀다면 취소, 아니면 좋아요 추가
          const newLikes = likedPosts.has(postId)
            ? post.likes - 1
            : post.likes + 1;
          return { ...post, likes: newLikes };
        }
        return post;
      });

      // 좋아요 상태 업데이트
      const newLikedPosts = new Set(likedPosts);
      if (likedPosts.has(postId)) {
        newLikedPosts.delete(postId);
      } else {
        newLikedPosts.add(postId);
      }

      // AsyncStorage에 업데이트된 정보 저장
      await AsyncStorage.setItem("posts", JSON.stringify(updatedPosts));
      await AsyncStorage.setItem(
        "likedPosts",
        JSON.stringify([...newLikedPosts])
      );

      // 상태 업데이트
      setPosts(updatedPosts);
      setLikedPosts(newLikedPosts);
    } catch (error) {
      console.error("좋아요 업데이트 에러:", error);
    }
  };

  // 검색과 태그 필터링
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesTag = selectedTag === "전체" || post.tag === selectedTag;
    return matchesSearch && matchesTag;
  });

  // 게시글 렌더링
  const renderItem = ({ item }) => {
    // 날짜 포맷팅 함수
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}.${month}.${day}`;
    };

    return (
      <TouchableOpacity
        style={styles.postItem}
        onPress={() => {
          if (item?.id) {
            navigation.navigate("PostDetail", { postId: item.id });
          } else {
            Alert.alert("오류", "게시글 ID가 없습니다.");
          }
        }}
      >
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.tagContainer}>
          <Text style={styles.tag}>{item.tag}</Text>
        </View>
        <View style={styles.postInfo}>
          <View style={styles.leftInfo}>
            <Text style={styles.author}>{item.author}</Text>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.interactionContainer}>
            <TouchableOpacity style={styles.interactionButton}>
              <Icon name="chat-bubble-outline" size={20} color="#666" />
              <Text style={styles.interactionText}>
                {item.comments?.length || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.interactionButton}
              onPress={() => toggleLike(item.id)}
            >
              <Icon
                name={likedPosts.has(item.id) ? "favorite" : "favorite-border"}
                size={20}
                color={likedPosts.has(item.id) ? "#ff6b6b" : "#666"}
              />
              <Text style={styles.interactionText}>{item.likes || 0}</Text>
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
          keyExtractor={(item) => item.id}
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
    fontSize: 12,
    color: "#666",
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
