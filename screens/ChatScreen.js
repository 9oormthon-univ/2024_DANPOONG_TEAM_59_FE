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

// ChatItem 컴포넌트 추가
const ChatItem = React.memo(
  ({ item, navigation, jwtToken, onPostPreviewFetch }) => {
    const [postPreview, setPostPreview] = useState(null);

    useEffect(() => {
      const fetchPostPreview = async () => {
        if (!item.postId) return;

        try {
          const response = await fetch(
            `http://3.34.96.14:8080/api/posts/${item.postId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${jwtToken}`,
              },
            }
          );

          if (!response.ok)
            throw new Error("게시글 정보를 가져오는데 실패했습니다");

          const data = await response.json();
          setPostPreview(data);
          if (onPostPreviewFetch) {
            onPostPreviewFetch(item.postId, data);
          }
        } catch (error) {
          console.error("게시글 정보 조회 실패:", error);
        }
      };

      fetchPostPreview();
    }, [item.postId]);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          navigation.navigate("ChatNew", {
            chatId: item.chatId,
            postId: item.postId,
            userName: item.nickname,
            postInfo: {
              title: item.title,
              tags: item.tags,
              date: formatDate(item.lastMessageTime),
            },
          })
        }
      >
        <View style={styles.chatContent}>
          <View style={styles.profileContainer}>
            {item.profileImage ? (
              <Image
                source={{ uri: item.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.defaultProfileImage} />
            )}
          </View>
          <View style={styles.chatInfo}>
            <Text style={styles.chatName}>{item.nickname || "알 수 없음"}</Text>
            {postPreview && (
              <View style={styles.postPreviewContainer}>
                <Text style={styles.postTitle} numberOfLines={1}>
                  {postPreview.title}
                </Text>
                <Text style={styles.postContent} numberOfLines={2}>
                  {postPreview.content}
                </Text>
              </View>
            )}
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage || "새로운 채팅방입니다"}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            {formatDate(item.lastMessageTime)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
);

const Chat = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState("전체");
  const isFocused = useIsFocused();
  const [jwtToken, setJwtToken] = useState(null);
  const [postPreviews, setPostPreviews] = useState({});

  // JWT 토큰 가져오기
  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (!token) {
          Alert.alert("알림", "로그인이 필요한 서비스입니다.");
          navigation.navigate("Login");
          return;
        }
        setJwtToken(token);
      } catch (error) {
        console.error("토큰을 가져오는데 실패했습니다:", error);
        Alert.alert("오류", "인증 정보를 확인하는데 실패했습니다.");
      }
    };
    getToken();
  }, []);

  // 채팅 목록 불러오기
  const loadChats = async () => {
    if (!jwtToken) {
      console.log("🚫 Error: JWT 토큰 없음");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://3.34.96.14:8080/api/chatrooms", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      // 응답 상태 코드 및 상세 정보 로깅
      console.log(`📡 Response Status: ${response.status}`);
      console.log(`📡 Response Status Text: ${response.statusText}`);

      // 에러 응답 처리
      if (!response.ok) {
        const errorBody = await response.text();
        console.error("🚨 Error Response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
        });

        switch (response.status) {
          case 400:
            console.error("🚨 400: 잘못된 요청");
            Alert.alert("오류", "잘못된 요청입니다.");
            break;
          case 401:
            console.error("🚨 401: 인증되지 않은 요청");
            await AsyncStorage.removeItem("jwtToken");
            Alert.alert("인증 오류", "다시 로그인해주세요.");
            navigation.navigate("Login");
            break;
          case 403:
            console.error("🚨 403: 접근 권한 없음");
            Alert.alert("권한 오류", "접근 권한이 없습니다.");
            break;
          case 404:
            console.error("🚨 404: 리소스를 찾을 수 없음");
            Alert.alert("오류", "요청한 정보를 찾을 수 없습니다.");
            break;
          case 500:
            console.error("🚨 500: 서버 내부 오류");
            Alert.alert(
              "서버 오류",
              "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
            );
            break;
          default:
            console.error(`🚨 ${response.status}: 알 수 없는 오류`);
            Alert.alert("오류", "알 수 없는 오류가 발생했습니다.");
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      console.log("📥 Received data length:", text.length);

      let data;
      try {
        data = JSON.parse(text);
        console.log("✅ Data successfully parsed");
      } catch (parseError) {
        console.error("🚨 JSON Parse Error:", parseError);
        console.error("🚨 Raw data:", text);
        throw new Error("JSON 파싱 오류");
      }

      const formattedChats = data.map((chat) => ({
        chatId: chat.chatRoomId,
        postId: chat.id,
        nickname: chat.otherUserName,
        profileImage: chat.otherProfileImage,
        lastMessage: chat.lastMessage || "새로운 채팅방입니다",
        lastMessageTime: chat.updatedAt,
        tags: [chat.tag] || [],
        title: chat.title,
        neighborhood: chat.otherUserNeighborhood,
        unreadCount: chat.unreadMessageCount,
      }));

      setChats(formattedChats);
    } catch (error) {
      console.error("채팅 목록을 불러오는데 실패했습니다:", error);
      Alert.alert("오류", "채팅 목록을 불오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadChats();
    }
  }, [isFocused]);

  // 태그 필터링 로직 추가
  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.nickname
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesTag =
      selectedTag === "전체" || (chat.tags && chat.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  // Chat 컴포넌트 내부의 renderItem 함수 수정
  const renderItem = ({ item }) => {
    if (!item || !item.chatId) return null;

    return (
      <ChatItem
        item={item}
        navigation={navigation}
        jwtToken={jwtToken}
        onPostPreviewFetch={(postId, data) => {
          setPostPreviews((prev) => ({
            ...prev,
            [postId]: data,
          }));
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>채팅</Text>
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

        <View style={styles.tagFilterContainer}>
          <View style={styles.tagButtons}>
            {["전체", "#돌봄지원", "#돌봄받기", "#나눔받기"].map((tag) => (
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
        </View>

        <View style={styles.tagListDivider} />

        <View style={styles.postListDivider} />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFEDAE" />
          </View>
        ) : (
          <FlatList
            data={filteredChats}
            renderItem={renderItem}
            keyExtractor={(item) => item?.chatId?.toString()}
            contentContainerStyle={styles.listContainer}
          />
        )}

        <TouchableOpacity
          style={styles.writeButton}
          onPress={() => navigation.navigate("ChatNewScreen")}
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
              채팅
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <BottomNavigation navigation={navigation} currentRoute="chat" />
    </View>
  );
};

const additionalStyles = StyleSheet.create({
  chatItem: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  chatContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileContainer: {
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  postPreviewContainer: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  postContent: {
    fontSize: 12,
    color: "#666",
  },
});

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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  tagContainer: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: "#FBFBFB",
  },
  tag: {
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  defaultTag: {
    backgroundColor: "#FFEDAE",
    borderRadius: 12,
  },
  infoTag: {
    backgroundColor: "#FFECA1",
    borderRadius: 30,
  },
  adviceTag: {
    backgroundColor: "FFECA1",
    borderRadius: 12,
  },
  shareTag: {
    backgroundColor: "#2196F3",
    borderRadius: 12,
  },
  coloredTagText: {
    color: "#fff",
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
    marginBottom: 4, // 게시글 리스트와의 간격
  },
  ...additionalStyles,
});

export default Chat;
