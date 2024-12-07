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
  Modal,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import { useIsFocused } from "@react-navigation/native";
import BottomNavigation from "../components/BottomNavigation";

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
};

const Board = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState("전체");
  const isFocused = useIsFocused();
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState("최신순");
  const [userProfileImage, setUserProfileImage] = useState(null);
  const [userNickname, setUserNickname] = useState("");
  const [jwtToken, setJwtToken] = useState(null);

  // JWT 토큰과 게시글 로딩 관련 useEffect 수정
  useEffect(() => {
    const getTokenAndLoadPosts = async () => {
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        console.log("저장된 토��:", token);
        if (!token) {
          Alert.alert("알림", "로그인이 필요한 서비스입니다.");
          navigation.navigate("Login");
          return;
        }
        setJwtToken(token);
        await loadPosts(token);
      } catch (error) {
        console.error("토큰을 가져오는데 실패했습니다:", error);
        Alert.alert("오류", "인증 정보를 확인하는데 실패했습니다.");
      }
    };

    if (isFocused) {
      getTokenAndLoadPosts();
    }
  }, [isFocused]);

  // loadPosts 함수 수정
  const loadPosts = async (token) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch("http://3.34.96.14:8080/api/posts", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("서버 응답 �태:", response.status);
      const responseData = await response.text();
      console.log("서버 응답 ��이터:", responseData);

      if (response.status === 401) {
        await AsyncStorage.removeItem("jwtToken");
        Alert.alert("세션 만료", "다시 로그인해주세요.");
        navigation.navigate("Login");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = JSON.parse(responseData);
      if (Array.isArray(data)) {
        console.log("받아온 게시글 수:", data.length);
        setPosts(data);
      } else {
        console.error("서버 응답이 배열 형식이 아닙니다:", data);
        setPosts([]);
      }
    } catch (error) {
      console.error("게시글을 불러오는데 실패했습니다:", error);
      Alert.alert("오류", "게시글을 불러오는데 실패했�니다.");
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 좋아요 상태 불러오기
  const loadLikedPosts = () => {
    // 임시 더미 데이터로 대체하거나 API 호출로 변경 필요
    setLikedPosts(new Set());
  };

  // 프로필 정보 로딩 함수
  const loadUserProfile = () => {
    // 임시 더미 데이터로 대체하거 API 호출로 변경 필요
    setUserProfileImage(null);
    setUserNickname("사용자");
  };

  // 게시글과 좋아요 상태 불러오기
  useEffect(() => {
    if (isFocused) {
      loadPosts();
      loadLikedPosts();
      loadUserProfile();
    }
  }, [isFocused]);

  // 좋아요 토글 함수 수정
  const toggleLike = async (postId) => {
    if (!jwtToken) {
      Alert.alert("인증 오류", "로그인이 필요합니다.");
      return;
    }

    try {
      console.log(
        "요청 URL:",
        `http://3.34.96.14:8080/api/postLikes/${postId}/likes/toggle`
      );
      console.log("JWT Token:", jwtToken);

      const response = await fetch(
        `http://3.34.96.14:8080/api/postLikes/${postId}/likes/toggle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response body:", responseText);

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert("인증 오류", "로그인이 필요합니다.");
          return;
        }
        throw new Error(`서버 응답 오류: ${response.status} - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.log("JSON 파싱 오류:", e);
        data = null;
      }

      console.log("파싱된 응답 데이터:", data);

      // 게시글 상태 업데이트
      setPosts(
        posts.map((post) => {
          if (post.postId === postId) {
            const newIsLiked = !post.isLiked;
            return {
              ...post,
              isLiked: newIsLiked,
              likeCount: newIsLiked ? post.likeCount + 1 : post.likeCount - 1,
            };
          }
          return post;
        })
      );
    } catch (error) {
      console.error("좋아요 처리 중 상세 오류:", error);
      Alert.alert("오류", `좋아요 처리에 실패했습니다: ${error.message}`);
    }
  };

  // 검색과 태그 필터링
  const filteredPosts =
    posts?.filter((post) => {
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
    }) || [];

  // 게시글 정렬 함수 추가
  const sortPosts = (posts) => {
    return [...posts].sort((a, b) => {
      switch (sortOrder) {
        case "최신순":
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case "이름순":
          return a.title.localeCompare(b.title);
        case "좋아요순":
          return b.likeCount - a.likeCount;
        default:
          return 0;
      }
    });
  };

  // 정렬된 게시글
  const sortedPosts = sortPosts(filteredPosts);

  // 게시글 렌더링
  const renderItem = ({ item }) => {
    if (!item || !item.postId || !item.title) return null;

    const hasImage = item.imageUrls && item.imageUrls.length > 0;

    const getTagStyle = (tag) => {
      switch (tag) {
        case "정보":
          return {
            backgroundColor: "#FFECA1",
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
            marginRight: 4,
          };
        case "조언":
          return {
            backgroundColor: "#FFECA1",
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
            marginRight: 4,
          };
        case "나눔":
          return {
            backgroundColor: "#FFECA1",
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
            marginRight: 4,
          };
        default:
          return {
            backgroundColor: "#FFECA1",
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
            marginRight: 4,
          };
      }
    };

    const getTagTextStyle = (tag) => {
      return {
        color: "#FE9F40",
        fontSize: 11,
        fontWeight: "bold",
      };
    };

    return (
      <TouchableOpacity
        style={styles.postItem}
        onPress={() =>
          navigation.navigate("PostDetail", { postId: item.postId })
        }
      >
        {hasImage && (
          <View style={styles.thumbnailContainer}>
            <Image
              source={{ uri: item.imageUrls[0] }}
              style={styles.thumbnailImage}
            />
          </View>
        )}

        <View
          style={[
            styles.contentContainer,
            !hasImage && styles.contentWithoutImage,
          ]}
        >
          <View style={styles.postMainInfo}>
            <Text style={styles.date}>{formatDate(item.updatedAt)}</Text>
            <View style={styles.titleContainer}>
              <View style={styles.tagContainer}>
                {(item.tags || []).map((tag, index) => (
                  <View key={index} style={getTagStyle(tag)}>
                    <Text style={getTagTextStyle(tag)}>#{tag}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
          </View>

          <View style={styles.bottomInfo}>
            <View
              style={[
                styles.leftInfo,
                !hasImage && styles.leftInfoWithoutImage,
              ]}
            >
              <View style={styles.authorContainer}>
                {item.profileImage ? (
                  <Image
                    source={{ uri: item.profileImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.defaultProfileImage} />
                )}
                <Text style={styles.author}>
                  {item.nickname || "알 수 없음"}
                </Text>
              </View>
            </View>
            <View style={styles.interactionContainer}>
              <View style={styles.interactionButton}>
                <Icon name="chat-bubble-outline" size={15} color="#666" />
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
                  size={15}
                  color={item.isLiked ? "#FE9F40" : "#666"}
                />
                <Text style={styles.interactionText}>
                  {item.likeCount || 0}
                </Text>
              </TouchableOpacity>
            </View>
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

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="검색어를 입력하세요"
              value={searchText}
              onChangeText={setSearchText}
            />
            <Icon
              name="search"
              size={24}
              color="#666"
              style={styles.searchIcon}
            />
          </View>
        </View>

        {/* 태그 필터 컨테이너 */}
        <View style={styles.tagFilterContainer}>
          <View style={styles.tagButtons}>
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
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setModalVisible(true)}
          >
            <Icon name="sort" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 첫 번째 구분선 */}
        <View style={styles.tagListDivider} />

        {/* 두 번째 구분선 */}
        <View style={styles.postListDivider} />

        {/* 게시글 리스트 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFEDAE" />
          </View>
        ) : (
          <FlatList
            data={sortedPosts}
            renderItem={renderItem}
            keyExtractor={(item) => (item?.postId || Math.random()).toString()}
            contentContainerStyle={styles.listContainer}
          />
        )}

        <TouchableOpacity
          style={styles.writeButton}
          onPress={() => navigation.navigate("boardNew")}
        >
          <View style={styles.writeButtonIcon}>
            <Text style={[styles.writeButtonText, { fontSize: 40 }]}>+</Text>
            <Text
              style={[
                styles.writeButtonText,
                { fontSize: 12 },
                { color: "#FFECA1" },
              ]}
            >
              글쓰기
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <BottomNavigation navigation={navigation} currentRoute="board" />

      {/* 정렬 옵션 모달 수정 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>정렬 기준 선택</Text>
            <Pressable
              onPress={() => {
                setSortOrder("최신순");
                setModalVisible(false);
              }}
              style={({ pressed }) => [
                styles.modalOption,
                pressed && styles.modalOptionPressed,
              ]}
            >
              {({ pressed }) => (
                <Text
                  style={[
                    styles.modalOptionText,
                    pressed && styles.modalOptionTextPressed,
                  ]}
                >
                  최신순
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => {
                setSortOrder("이름순");
                setModalVisible(false);
              }}
              style={({ pressed }) => [
                styles.modalOption,
                pressed && styles.modalOptionPressed,
              ]}
            >
              {({ pressed }) => (
                <Text
                  style={[
                    styles.modalOptionText,
                    pressed && styles.modalOptionTextPressed,
                  ]}
                >
                  이름순
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => {
                setSortOrder("좋아요순");
                setModalVisible(false);
              }}
              style={({ pressed }) => [
                styles.modalOption,
                pressed && styles.modalOptionPressed,
              ]}
            >
              {({ pressed }) => (
                <Text
                  style={[
                    styles.modalOptionText,
                    pressed && styles.modalOptionTextPressed,
                  ]}
                >
                  좋아요순
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
            >
              {({ pressed }) => (
                <Text
                  style={[
                    styles.closeButtonText,
                    pressed && styles.closeButtonTextPressed,
                  ]}
                >
                  닫기
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBFBFB",
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 16,
    marginTop: 63,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontWeight: "bold",
  },
  searchIcon: {
    marginLeft: 10,
  },
  tagFilterContainer: {
    flexDirection: "row",
    backgroundColor: "#FBFBFB",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  tagButtons: {
    flexDirection: "row",
    flex: 1,
    marginLeft: 30,
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
    borderWidth: 1,
    borderColor: "#E78B00",
  },
  selectedAllTagButton: {
    backgroundColor: "#FFECA1",
    borderWidth: 1,
    borderColor: "#E78B00",
  },
  selectedInfoTagButton: {
    backgroundColor: "#FFECA1",
    borderWidth: 1,
    borderColor: "#E78B00",
  },
  selectedAdviceTagButton: {
    backgroundColor: "#FFECA1",
    borderWidth: 1,
    borderColor: "#E78B00",
  },
  selectedShareTagButton: {
    backgroundColor: "#FFECA1",
    borderWidth: 1,
    borderColor: "#E78B00",
  },
  tagText: {
    fontSize: 14,
    color: "#666",
  },
  selectedTagText: {
    color: "#E78B00",
    fontWeight: "bold",
  },
  selectedAllTagText: {
    color: "#E78B00",
    fontWeight: "bold",
  },
  selectedInfoTagText: {
    color: "#E78B00",
    fontWeight: "bold",
  },
  selectedAdviceTagText: {
    color: "#fff",
    fontWeight: "bold",
  },
  selectedShareTagText: {
    color: "#fff",
    fontWeight: "bold",
  },
  postItem: {
    flexDirection: "row",
    padding: 16,
    marginBottom: 14,
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F7F7F7",
  },
  thumbnailContainer: {
    marginRight: 12,
  },
  thumbnailImage: {
    width: 110,
    height: 110,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    marginLeft: 12,
  },
  contentWithoutImage: {
    marginLeft: 0,
  },
  postMainInfo: {
    marginBottom: 8,
    gap: 8,
  },
  titleContainer: {
    gap: 8,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    backgroundColor: "#FBFBFB",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
  },
  bottomInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 8,
  },
  leftInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  interactionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  interactionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  interactionText: {
    fontSize: 14,
    color: "#FE9F40",
  },
  writeButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#FE9F40",
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  writeButtonText: {
    color: "#FFECA1",
    fontWeight: "bold",
    textAlign: "center",
  },
  writeButtonIcon: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  modalOptionPressed: {
    backgroundColor: "#FFECA1",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#666",
  },
  modalOptionTextPressed: {
    color: "#E78B00",
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  submitButtonContainer: {
    position: "absolute",
    bottom: 60, // BottomNavigation 높이만큼 여백 추가
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 16,
  },
  sortButton: {
    position: "absolute",
    right: 16,
    padding: 8,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profileImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  defaultProfileImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#DDD",
  },
  author: {
    color: "black",
    fontSize: 13,
  },
  leftInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  leftInfoWithoutImage: {
    marginLeft: 0,
  },
  date: {
    color: "#666",
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  closeButtonPressed: {
    backgroundColor: "#FE9F40",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#666",
  },
  closeButtonTextPressed: {
    color: "#fff",
    fontWeight: "bold",
  },

  postListDivider: {
    height: 1,
    backgroundColor: "#F7F7F7",
    width: "100%",
    marginBottom: 4, // 게시글 리리스트와의 간격
  },
});

export default Board;
