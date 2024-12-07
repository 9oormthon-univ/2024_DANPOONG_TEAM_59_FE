import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import BottomNavigation from "../components/BottomNavigation";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

// Notifications 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 푸큰을 서버에 저장하는 함수 추가
const saveTokenToServer = async (token) => {
  try {
    const jwtToken = await AsyncStorage.getItem("jwtToken");
    const response = await fetch(
      "http://3.34.96.14:8080/api/notification/tokens/push",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ token }),
      }
    );

    if (!response.ok) {
      throw new Error("토큰 저장 실패");
    }

    console.log("푸시 알림 토큰이 서버에 저장되었습니다.");
  } catch (error) {
    console.error("토큰 서버 저장 실패:", error);
  }
};

// registerForPushNotificationsAsync 함수 수정
async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert("알림 권한이 필요합니다");
      return;
    }

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: "your-project-id", // expo 프로젝트 ID 입력
      })
    ).data;

    // 토큰을 서버에 저장
    await saveTokenToServer(token);
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

const ChildCare = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState("전체");
  const [lastUrgentPostId, setLastUrgentPostId] = useState(null);
  const isFocused = useIsFocused();
  const [inAppNotification, setInAppNotification] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // 위치 정보 가져오기
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const locationData = await AsyncStorage.getItem("userLocation");
        if (locationData) {
          const parsedLocation = JSON.parse(locationData);
          setUserLocation(parsedLocation.address);
          console.log("저장된 위치 정보:", parsedLocation);
        }
      } catch (error) {
        console.error("위치 정보 가져오기 실패:", error);
      }
    };

    getUserLocation();
  }, []);

  // 알림 권한 요청
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("알림 권한이 필요합니다");
      }
    })();
  }, []);

  const checkAndRefreshToken = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");

      if (!jwtToken) {
        console.log("토큰이 없습니다.");
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return null;
      }

      return jwtToken;
    } catch (error) {
      console.error("토큰 확인 중 오류:", error);
      return null;
    }
  };

  // 게시글 불러오기
  const loadPosts = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      console.log("JWT 토큰 확인:", jwtToken?.substring(0, 20) + "...");

      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      // API 요청 전에 토큰 유효성 확인
      try {
        const tokenCheckResponse = await fetch(
          "http://3.34.96.14:8080/api/auth/login/check",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${jwtToken}`,
            },
          }
        );

        console.log("토큰 체크 응답:", tokenCheckResponse.status);

        if (tokenCheckResponse.status === 401) {
          console.log("토큰이 만료되었습니다.");
          await AsyncStorage.removeItem("jwtToken");
          Alert.alert("알림", "로그인이 만료되었습니다. 다시 로그인해주세요.");
          navigation.navigate("KakaoLogin");
          return;
        }
      } catch (error) {
        console.log("토큰 확인 실패:", error);
      }

      // 게시글 목록 요청
      const response = await fetch("http://3.34.96.14:8080/api/carePosts", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("게시글 목록 API 응답 상태:", response.status);

      if (response.status === 401) {
        console.log("인증 실패");
        await AsyncStorage.removeItem("jwtToken");
        Alert.alert("알림", "로그인이 만료되었습니다. 다시 로그인해주세요.");
        navigation.navigate("KakaoLogin");
        return;
      }

      const responseText = await response.text();
      console.log("서버 응답:", responseText);

      if (!response.ok) {
        if (response.status === 500) {
          Alert.alert(
            "서버 오류",
            "서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
          );
          return;
        }
        throw new Error(`서버 오류 (${response.status}): ${responseText}`);
      }

      try {
        const data = JSON.parse(responseText);
        console.log("파싱된 게시글 데이터:", data);
        if (Array.isArray(data)) {
          setPosts(data);
          console.log("게시글 데이터 저장 완료. 첫 번째 게시글:", data[0]);
          checkNewUrgentPosts(data);
        }
      } catch (e) {
        console.error("JSON 파싱 오류:", e);
      }
    } catch (error) {
      console.error("게시글 로딩 중 오류:", error);
      Alert.alert(
        "게시글 로딩 실패",
        "네트워크 연결을 확인하고 다시 시도해주세요."
      );
    }
  };

  // 긴급 게시물 체크 및 알림 함수 수정
  const checkNewUrgentPosts = async (newPosts) => {
    const urgentPosts = newPosts.filter((post) => post.tags?.includes("긴급"));

    if (urgentPosts.length > 0) {
      const latestUrgentPost = urgentPosts[0];
      const lastNotifiedId = await AsyncStorage.getItem(
        "lastNotifiedUrgentPostId"
      );

      if (lastNotifiedId !== String(latestUrgentPost.carePostId)) {
        // 푸시 알림과 함께 인앱 알림도 표시
        setInAppNotification({
          title: "새로운 긴급 돌봄 요청",
          body: latestUrgentPost.title,
          postId: latestUrgentPost.carePostId,
        });

        // 3초 후 알림 자동 제거
        setTimeout(() => {
          setInAppNotification(null);
        }, 3000);

        await AsyncStorage.setItem(
          "lastNotifiedUrgentPostId",
          String(latestUrgentPost.carePostId)
        );
      }
    }
  };

  // 푸시 알림 스케줄링 함수 추가
  async function schedulePushNotification({ title, body, data }) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: "default",
        },
        trigger: null, // 즉시 알림
      });
    } catch (error) {
      console.error("알림 전송 실패:", error);
    }
  }

  // 화면이 포커스될 때마다 게시글 로드
  useEffect(() => {
    if (isFocused) {
      loadPosts();
    }
  }, [isFocused]);

  // 알림 클릭 시 해당 게시글로 이동
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const postId = response.notification.request.content.data.postId;
        navigation.navigate("ChildCareDetail", { postId });
      }
    );

    return () => subscription.remove();
  }, []);

  // 검색과 태그 필터링
  const filteredPosts = posts
    .sort((a, b) => {
      // 긴급 우선 정렬
      if (a.isEmergency && !b.isEmergency) return -1;
      if (!a.isEmergency && b.isEmergency) return 1;

      // 날짜 내림차순 정렬
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    })
    .filter((post) => {
      const matchesSearch = post.title
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchesTag =
        selectedTag === "전체" ||
        (selectedTag === "긴급" && post.isEmergency) ||
        post.tag === selectedTag;
      return matchesSearch && matchesTag;
    });

  // 게시글 렌더링
  const renderItem = ({ item }) => {
    if (!item || !item.carePostId || !item.title) return null;

    // 태그 배열 생성
    const tags = [];
    if (item.isEmergency) tags.push("긴급");
    if (item.tag) tags.push(item.tag);

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
          navigation.navigate("ChildCareDetail", {
            carePostId: item.carePostId,
          })
        }
      >
        <Text style={styles.date}>{formatDate(item.updatedAt)}</Text>
        <View style={styles.titleTagContainer}>
          <View style={styles.tagContainer}>
            {tags.map((tag, index) => (
              <Text
                key={index}
                style={[
                  styles.tag,
                  tag === "긴급" && styles.urgentPostTag,
                  tag === "예약중" && styles.reservingPostTag,
                  tag === "구인완료" && styles.completedPostTag,
                  tag === "구인중" && styles.recruitingPostTag,
                ]}
              >
                {tag}
              </Text>
            ))}
          </View>
          <Text style={styles.title}>{item.title}</Text>
        </View>
        <View style={styles.bottomInfo}>
          <View style={styles.authorLocationContainer}>
            <View style={styles.authorContainer}>
              {item.kakaoProfileImageUrl ? (
                <Image
                  source={{ uri: item.kakaoProfileImageUrl }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.defaultProfileImage} />
              )}
              <Text style={styles.author}>{item.nickname}</Text>
              {userLocation && (
                <>
                  <Text style={styles.locationDot}>·</Text>
                  <Text style={styles.locationText}>
                    {userLocation.city} {userLocation.district}
                  </Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.interactionContainer}>
            <View style={styles.interactionButton}>
              <Icon name="chat-bubble-outline" size={20} color="#666" />
              <Text style={[styles.interactionText, { color: "#E78B00" }]}>
                {item.commentCount || 0}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 컴포넌트 내부에 추가
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  // 컴포넌트 마운트 시 서버 상태 확인
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch("http://3.34.96.14:8080/health");
        console.log("서버 상태 확인:", response.status);
      } catch (error) {
        console.error("서버 연결 확인 실패:", error);
      }
    };

    checkServerStatus();
  }, []);

  // 컴포넌트 마운트 시 토큰 확인
  useEffect(() => {
    const checkAuth = async () => {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        navigation.navigate("KakaoLogin");
        return;
      }
      loadPosts();
    };

    if (isFocused) {
      checkAuth();
    }
  }, [isFocused]);

  // 주기적으로 새 게시물 확인 (선택사항)
  useEffect(() => {
    if (isFocused) {
      const interval = setInterval(() => {
        loadPosts();
      }, 30000); // 30초마다 확인

      return () => clearInterval(interval);
    }
  }, [isFocused]);

  // 알림 ��신 핸들러 추가
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body } = notification.request.content;
        setInAppNotification({
          title,
          body,
          postId: notification.request.content.data?.postId,
        });

        // 3초 후 인앱 알림 제거
        setTimeout(() => {
          setInAppNotification(null);
        }, 3000);
      }
    );

    return () => {
      notificationListener.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>자녀 돌봄</Text>
        </View>

        {/* 검색창 */}
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
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
          </View>
        </View>

        {/* 태그 필터 */}
        <View style={styles.tagFilterContainer}>
          {["전체", "긴급", "구인중", "구인완료", "예약중"].map((tags) => (
            <TouchableOpacity
              key={tags}
              style={[
                styles.tagButton,
                selectedTag === tags && styles.selectedTagButton,
                tags === "긴급" && styles.urgentTag,
                tags === "예약중" && styles.reservingTag,
                tags === "구인완료" && styles.completedTag,
                tags === "구인중" && styles.recruitingTag,
              ]}
              onPress={() => setSelectedTag(tags)}
            >
              <Text
                style={[
                  styles.tagText,
                  selectedTag === tags && styles.selectedTagText,
                  tags === "긴급" && styles.urgentTagText,
                  tags === "예약중" && styles.reservingTagText,
                  tags === "구인완료" && styles.completedTagText,
                  tags === "구인중" && styles.recruitingTagText,
                ]}
              >
                {tags}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredPosts}
          renderItem={renderItem}
          keyExtractor={(item) => item.carePostId}
          contentContainerStyle={styles.listContainer}
        />

        <TouchableOpacity
          style={styles.writeButton}
          onPress={() => navigation.navigate("ChildCareNew")}
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

      {/* 인앱 알림 컴포넌트 */}
      {inAppNotification && (
        <TouchableOpacity
          style={styles.inAppNotification}
          onPress={() => {
            navigation.navigate("ChildCareDetail", {
              postId: inAppNotification.postId,
            });
            setInAppNotification(null);
          }}
        >
          <View>
            <Text style={styles.notificationTitle}>
              {inAppNotification.title}
            </Text>
            <Text style={styles.notificationBody}>
              {inAppNotification.body}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setInAppNotification(null)}
          >
            <Icon name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      <BottomNavigation navigation={navigation} currentRoute="childcare" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBFBFB",
  },
  header: {
    padding: 16,
    marginTop: 40,
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
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  searchIcon: {
    marginLeft: 10,
    color: "#acabb3",
  },
  tagFilterContainer: {
    flexDirection: "row",
    paddingVertical: 12,
    backgroundColor: "#FBFBFB",
    borderBottomWidth: 1,
    borderBottomColor: "#f7f7f7",
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#FFECA1",
  },
  selectedTagButton: {
    backgroundColor: "#FFEDAE",
    borderWidth: 1,
    borderColor: "#E78B00",
  },
  tagText: {
    fontSize: 14,
    color: "#606060",
  },
  selectedTagText: {
    color: "#E78B00",
    fontWeight: "bold",
  },
  postItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#F7F7F7",
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
    gap: 4,
  },
  author: {
    color: "black",
    fontSize: 13,
  },
  date: {
    color: "#666",
    fontSize: 12,
    marginBottom: 8,
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
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  tag: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  urgentPostTag: {
    backgroundColor: "#ffebee",
    color: "black",
  },
  reservingPostTag: {
    backgroundColor: "#e8f5e9",
    color: "black",
  },
  completedPostTag: {
    backgroundColor: "#fff3e0",
    color: "#ff9800",
  },
  recruitingPostTag: {
    backgroundColor: "#e3f2fd",
    color: "black",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  interactionContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  urgentTag: {
    backgroundColor: "#ffebee",
  },
  reservingTag: {
    backgroundColor: "#e8f5e9",
  },
  completedTag: {
    backgroundColor: "#fff3e0",
  },
  recruitingTag: {
    backgroundColor: "#e3f2fd",
  },
  urgentTagText: {
    color: "#606060",
  },
  reservingTagText: {
    color: "#606060",
  },
  completedTagText: {
    color: "#606060",
  },
  recruitingTagText: {
    color: "#606060",
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  author: {
    fontSize: 13,
    color: "black",
    marginLeft: 6,
  },
  locationDot: {
    marginHorizontal: 6,
    color: "#666",
  },
  locationText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
  },
  profileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  defaultProfileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ddd",
  },
  bottomInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  authorLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
  },
  inAppNotification: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: "#FFEDAE",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 12,
    color: "#666",
  },
  closeButton: {
    padding: 4,
  },
  titleTagContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  tagContainer: {
    flexDirection: "row",
    marginRight: 8,
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    flex: 1, // 남은 공간을 모두 차지하도록 설정
  },
  tag: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  authorLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
  },
});

export default ChildCare;
