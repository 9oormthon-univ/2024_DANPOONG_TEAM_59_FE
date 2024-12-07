// API 연동 시도하던 코드입니다. 동네설정과 닉네임 변경까지는 통신이 됐는데, 나머지는 테스트를 못했습니다.

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import BottomNavigation from "../components/BottomNavigation";

const ADMIN_IDS = ["3797466405", "3037347547"];

const MyPage = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState({
    memberId: 0,
    kakaoName: "",
    nickName: "",
    profileImageUrl: "https://via.placeholder.com/100",
    points: 0,
    temperature: 36.5,
    province: "",
    city: "",
    district: "",
  });
  const [isLoadingLiked, setIsLoadingLiked] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [userPosts, setUserPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadUserInfo();
    checkAdminStatus();
    loadInitialData();
  }, []);

  const loadUserInfo = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        console.log("JWT 토큰이 없음");
        navigation.reset({
          index: 0,
          routes: [{ name: "KakaoLogin" }],
        });
        return;
      }

      const response = await fetch("http://3.34.96.14:8080/api/member/info", {
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
      setUserInfo(data);
    } catch (error) {
      console.error("사용자 정보 로딩 에러:", error);
      Alert.alert("오류", "사용자 정보를 불러오는데 실패했습니다.");
    }
  };

  const loadInitialData = async () => {
    setUserPosts([]);
    setLikedPosts([]);
  };

  const loadUserPoints = async () => {
    setUserInfo((prev) => ({
      ...prev,
      points: 100,
    }));
  };

  const loadLikedPosts = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        return [];
      }

      const response = await fetch("http://3.34.96.14:8080/api/member/", {
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
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  };

  const handleWrittenPostClick = async () => {
    setIsLoadingPosts(true);
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        return;
      }

      const response = await fetch("http://3.34.96.14:8080/api/member/posts", {
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
      setUserPosts(data);
      navigation.navigate("WrittenPost", { posts: data });
    } catch (error) {
      console.error("내가 쓴 글 로딩 에러:", error);
      Alert.alert("오류", "작성 글 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("jwtToken");
            navigation.reset({
              index: 0,
              routes: [{ name: "KakaoLogin" }],
            });
          } catch (error) {
            console.error("로그아웃 에러:", error);
            Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
          }
        },
      },
    ]);
  };

  const handleLikedPostClick = async () => {
    setIsLoadingLiked(true);
    try {
      const tempPosts = [];
      setLikedPosts(tempPosts);
      navigation.navigate("LikedPosts", { posts: tempPosts });
    } catch (error) {
      Alert.alert("오류", "좋아요 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingLiked(false);
    }
  };

  const fetchCareHistory = async () => {
    try {
      const careHistory = await ApiService.getCareHistory();
      return careHistory;
    } catch (error) {
      if (error.message === "인증이 필요합니다.") {
        navigation.navigate("KakaoLogin");
      } else {
        Alert.alert("오류", "돌봄 내역을 불러오는데 실패했습니다.");
      }
    }
  };

  const handleImagePick = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "사진 접근 권한이 필요합니다.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setUserInfo((prev) => ({
          ...prev,
          profileImageUrl: result.assets[0].uri,
        }));
        try {
          const userInfo = await AsyncStorage.getItem("userInfo");
          if (userInfo) {
            const parsedUserInfo = JSON.parse(userInfo);
            parsedUserInfo.properties.profile_image = result.assets[0].uri;
            await AsyncStorage.setItem(
              "userInfo",
              JSON.stringify(parsedUserInfo)
            );
          }
        } catch (error) {
          console.error("프로필 이미지 저장 실패:", error);
        }
      }
    } catch (error) {
      console.error("이미지 선택 오류:", error);
      Alert.alert("오류", "이미지를 선택하는 중 문제가 발생했습니다.");
    }
  };

  const handleWithdrawal = async () => {
    Alert.alert(
      "회원탈퇴",
      "정말 탈퇴하시겠습니까?\n탈퇴 시 모든 데이터가 삭제됩니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "탈퇴하기",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              navigation.reset({
                index: 0,
                routes: [{ name: "KakaoLogin" }],
              });
            } catch (error) {
              Alert.alert("오류", "회원��퇴 처리 중 문제가 발생했습니다.");
            }
          },
        },
      ]
    );
  };

  const checkAdminStatus = async () => {
    try {
      const userInfo = await AsyncStorage.getItem("userInfo");
      if (userInfo) {
        const parsedUserInfo = JSON.parse(userInfo);
        setIsAdmin(ADMIN_IDS.includes(parsedUserInfo.id.toString()));
      }
    } catch (error) {
      console.error("관리자 상태 확인 에러:", error);
    }
  };

  const handleAdminMenu = () => {
    Alert.alert("관리자 메뉴", "관리할 항목을 선택해주세요", [
      {
        text: "신고 내역",
        onPress: async () => {
          try {
            const reportedPosts = await AsyncStorage.getItem("reportedPosts");
            const reports = reportedPosts ? JSON.parse(reportedPosts) : [];
            navigation.navigate("ReportList", { reports });
          } catch (error) {
            console.error("신고 내역 로딩 에러:", error);
            Alert.alert("오류", "신고 내역을 불러올 수 없습니다.");
          }
        },
      },
      {
        text: "사용자 관리",
        onPress: async () => {
          try {
            const allUsers = await AsyncStorage.getItem("allUsers");
            const users = allUsers ? JSON.parse(allUsers) : [];
            navigation.navigate("UserManagement", { users });
          } catch (error) {
            console.error("사용자 목록 로딩 에러:", error);
            Alert.alert("오류", "사용자 목록을 불러올 수 없습니다.");
          }
        },
      },
      {
        text: "취소",
        style: "cancel",
      },
    ]);
  };

  const handleUpdateNickname = async () => {
    if (!newNickname.trim()) {
      Alert.alert("알림", "닉네임을 입력해주세요.");
      return;
    }

    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        return;
      }

      const response = await fetch(
        "http://3.34.96.14:8080/api/member/nickname",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nickname: newNickname.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setUserInfo((prev) => ({
        ...prev,
        nickName: newNickname.trim(),
      }));
      setIsEditingNickname(false);
      setNewNickname("");
      Alert.alert("성공", "닉네임이 변경되었습니다.");
    } catch (error) {
      console.error("닉네임 변경 에러:", error);
      Alert.alert("오류", "닉네임 변경에 실패했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.headerTitle}>마이페이지</Text>

          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: userInfo.profileImageUrl }}
                style={styles.profileImage}
              />
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleImagePick}
              >
                <View style={styles.editIconContainer}>
                  <Feather name="edit-2" size={16} color="#666" />
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{userInfo.kakaoName}</Text>

            <View style={styles.nicknameContainer}>
              {isEditingNickname ? (
                <View style={styles.nicknameEditContainer}>
                  <TextInput
                    style={styles.nicknameInput}
                    value={newNickname}
                    onChangeText={setNewNickname}
                    placeholder="새로운 닉네임 입력"
                    autoFocus
                  />
                  <View style={styles.nicknameEditButtons}>
                    <TouchableOpacity
                      style={styles.nicknameEditButton}
                      onPress={() => handleUpdateNickname()}
                    >
                      <Text style={styles.nicknameEditButtonText}>확인</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.nicknameEditButton,
                        styles.nicknameEditCancelButton,
                      ]}
                      onPress={() => {
                        setIsEditingNickname(false);
                        setNewNickname("");
                      }}
                    >
                      <Text style={styles.nicknameEditButtonText}>취소</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.nicknameRow}>
                  <View style={styles.nicknameWrapper}>
                    <Text style={styles.userNickname}>{userInfo.nickName}</Text>
                    <TouchableOpacity
                      style={styles.nicknameEditIcon}
                      onPress={() => {
                        setNewNickname(userInfo.nickName);
                        setIsEditingNickname(true);
                      }}
                    >
                      <Feather name="edit-2" size={16} color="#FF9231" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {isAdmin && (
              <TouchableOpacity
                style={styles.adminBadge}
                onPress={handleAdminMenu}
              >
                <Text style={styles.adminText}>관리자</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statsItem}>
              <Feather name="award" size={24} color="#FF9231" />
              <Text style={styles.statsLabel}>포인트</Text>
              <View style={styles.statsValueContainer}>
                <Text style={styles.statsValue}>{userInfo.points}</Text>
                <Text style={styles.statsUnit}>P</Text>
              </View>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsItem}>
              <Feather name="thermometer" size={24} color="#FF9231" />
              <Text style={styles.statsLabel}>온도</Text>
              <View style={styles.statsValueContainer}>
                <Text style={styles.statsValue}>{userInfo.temperature}</Text>
                <Text style={styles.statsUnit}>°C</Text>
              </View>
            </View>
          </View>

          <View style={styles.menuGrid}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("CouponWallet")}
            >
              <View style={styles.menuIconContainer}>
                <Feather name="tag" size={24} color="#FF9231" />
              </View>
              <Text style={styles.menuText}>쿠폰함</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("PointShopScreen")}
            >
              <View style={styles.menuIconContainer}>
                <Feather name="shopping-bag" size={24} color="#FF9231" />
              </View>
              <Text style={styles.menuText}>상점</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>나의 활동</Text>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={handleWrittenPostClick}
              disabled={isLoadingPosts}
            >
              <Text style={styles.menuRowText}>
                내가 쓴 글 ({userPosts.length})
              </Text>
              {isLoadingPosts && (
                <ActivityIndicator
                  style={styles.loadingSpinner}
                  color="#FF9231"
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate("CareList")} // 돌봄 내역인데 어떤 파일인지 헷갈려 일단 게시판, 수정 필요
            >
              <Text style={styles.menuRowText}>돌봄 내역</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={handleLikedPostClick}
              disabled={isLoadingLiked}
            >
              <Text style={styles.menuRowText}>
                좋아요 한 글 ({likedPosts.length})
              </Text>
              {isLoadingLiked && (
                <ActivityIndicator
                  style={styles.loadingSpinner}
                  color="#FF9231"
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate("Location")}
            >
              <Text style={styles.menuRowText}>동네설정</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>약관 및 정책</Text>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate("Policy")}
            >
              <Text style={styles.menuRowText}>약관 및 정책</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={handleLogout}>
              <Text style={[styles.menuRowText, styles.logoutText]}>
                로그아웃
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuRow} onPress={handleWithdrawal}>
              <Text style={[styles.menuRowText, styles.logoutText]}>
                회원탈퇴
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.bottomPadding} />
      </ScrollView>
      <BottomNavigation navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },
  editIconContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF9231",
    marginBottom: 4,
  },
  userNickname: {
    fontSize: 16,
    color: "#666",
  },
  adminBadge: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  adminText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFF3D8",
    borderRadius: 15,
    padding: 20,
    marginBottom: 24,
  },
  statsItem: {
    flex: 1,
    alignItems: "center",
  },
  statsDivider: {
    width: 1,
    backgroundColor: "#FFE4B8",
    marginHorizontal: 15,
  },
  statsLabel: {
    fontSize: 14,
    color: "#FF9231",
    marginTop: 8,
    marginBottom: 8,
  },
  statsValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statsUnit: {
    fontSize: 14,
    marginLeft: 4,
  },
  menuGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  menuItem: {
    alignItems: "center",
  },
  menuIconContainer: {
    backgroundColor: "#FFF3D8",
    padding: 12,
    borderRadius: 25,
    marginBottom: 8,
  },
  menuText: {
    color: "#FF9231",
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF9231",
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuIcon: {
    marginRight: 10,
  },
  menuRowText: {
    fontSize: 16,
    flex: 1,
  },
  logoutText: {
    color: "red",
  },
  bottomPadding: {
    paddingBottom: 60,
  },
  loadingSpinner: {
    marginLeft: 10,
  },
  nicknameContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 4,
  },
  nicknameRow: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  nicknameWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  nicknameEditIcon: {
    marginLeft: 8,
    padding: 4,
  },
  nicknameEditContainer: {
    width: "80%",
    alignItems: "center",
  },
  nicknameInput: {
    width: "100%",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#FF9231",
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
    textAlign: "center",
  },
  nicknameEditButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  nicknameEditButton: {
    backgroundColor: "#FF9231",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  nicknameEditCancelButton: {
    backgroundColor: "#666",
  },
  nicknameEditButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  userNickname: {
    fontSize: 16,
    color: "#666",
  },
});

export default MyPage;
