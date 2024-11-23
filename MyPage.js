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

  useEffect(() => {
    loadUserInfo();
    loadUserPoints();
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
            <Text style={styles.myActBoxText}>도움내역</Text>
            <TouchableOpacity onPress={() => navigation.navigate("LikedPosts")}>
              <Text style={styles.myActBoxText}>좋아요 한 글</Text>
            </TouchableOpacity>
            <Text style={styles.myActBoxText}>내 동네 설정</Text>
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
