import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomNavigation from "../components/BottomNavigation";

const MyPage = ({ navigation }) => {
  const [userNickname, setUserNickname] = useState("");
  const [userPoints, setUserPoints] = useState(0);
  const [likedPosts, setLikedPosts] = useState([]);
  const [userPosts, setUserPosts] = useState([]);

  useEffect(() => {
    loadUserInfo();
    loadUserPoints();
    const fetchData = async () => {
      try {
        await retryLoadLikedPosts();
        await loadUserPosts();
      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      }
    };

    fetchData();
  }, []);

  const loadUserInfo = async () => {
    try {
      const nickname = await AsyncStorage.getItem("userNickname");
      if (!nickname) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Nickname" }],
        });
        return;
      }
      setUserNickname(nickname);
    } catch (error) {
      console.error("사용자 정보 로딩 에러:", error);
    }
  };

  const loadUserPoints = async () => {
    try {
      const points = await AsyncStorage.getItem("userPoints");
      setUserPoints(Number(points) || 0);
    } catch (error) {
      console.error("포인트 로딩 에러:", error);
    }
  };

  const loadLikedPosts = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        return;
      }

      const response = await fetch("http://192.168.61.45:8080/api/member", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert("인증 만료", "다시 로그인해주세요.");
          navigation.navigate("KakaoLogin");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLikedPosts(data);

      console.log("좋아요 한 글 목록:", data); // 데이터 확인용 로그
    } catch (error) {
      console.error("좋아요 한 글 로딩 에러:", error);
      Alert.alert(
        "오류",
        "좋아요 한 글을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요."
      );
    }
  };

  const retryLoadLikedPosts = async (retryCount = 3) => {
    for (let i = 0; i < retryCount; i++) {
      try {
        await loadLikedPosts();
        return;
      } catch (error) {
        if (i === retryCount - 1) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

  const loadUserPosts = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        return;
      }

      const response = await fetch(
        "http://192.168.61.45:8080/api/member/posts",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert("인증 만료", "다시 로그인해주세요.");
          navigation.navigate("KakaoLogin");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUserPosts(data);
      console.log("내가 쓴 글 목록:", data);
    } catch (error) {
      console.error("내가 쓴 글 로딩 에러:", error);
      Alert.alert(
        "오류",
        "내가 쓴 글을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요."
      );
    }
  };

  const handleLogout = async () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("userNickname");
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            console.error("로그아웃 에러:", error);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>마이페이지</Text>
        </View>
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: "https://via.placeholder.com/50" }}
              style={styles.profileImage}
            />
            <View>
              <Text style={styles.userName}>userName</Text>
              <Text style={styles.nickName}>{userNickname}</Text>
            </View>
          </View>
        </View>

        <View style={styles.pointsContainer}>
          <View style={styles.pointsBox}>
            <Text style={styles.pointsTitle}>포인트:</Text>
            <Text style={styles.pointsAmount}>
              {userPoints.toLocaleString()}
            </Text>
            <Text style={styles.pointsLabel}>P</Text>
          </View>
        </View>

        <View style={styles.couponShopContainer}>
          <View style={styles.couponBox}>
            <Text style={styles.couponBoxTitle}>쿠폰함</Text>
          </View>
          <View style={styles.shopBox}>
            <Text style={styles.shopBoxTitle}>상점</Text>
          </View>
        </View>

        <View style={styles.myActContainer}>
          <View style={styles.myActBox}>
            <Text style={styles.myActBoxTitle}>나의 활동</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("WrittenPost")}
            >
              <Text style={styles.myActBoxText}>
                내가 쓴 글 ({userPosts.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("LikedPosts", { posts: likedPosts })
              }
            >
              <Text style={styles.myActBoxText}>
                좋아요 한 글 ({likedPosts.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.myInfoBoxText}>설정</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Policy")}>
            <Text style={styles.myInfoBoxText}>약관 및 정책</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={[styles.myInfoBoxText, { color: "red" }]}>
              로그아웃
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <BottomNavigation navigation={navigation} style={styles.bottomNav} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    marginBottom: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    paddingTop: 20,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  nickName: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  pointsContainer: {
    marginBottom: 10,
  },
  pointsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  pointsBox: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 15,
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pointsAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: "auto",
  },
  pointsLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 5,
  },
  couponShopContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 15,
    marginBottom: 30,
  },
  couponBox: {
    flex: 2,
    marginRight: 5,
    padding: 25,
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: "#f5f5f5",
  },
  shopBox: {
    flex: 2,
    padding: 25,
    marginLeft: 5,
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: "#f5f5f5",
  },
  couponBoxTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  shopBoxTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  myActContainer: {
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  myActBoxTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 30,
  },
  myActBoxText: {
    fontSize: 16,
    marginTop: 100,
    marginBottom: 30,
  },
  infoContainer: {
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  myInfoBoxText: {
    fontSize: 16,
    marginBottom: 30,
  },
});
export default MyPage;
