import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import KaKaoLogin from "./screens/KakaoLogin";
import Kakao from "./screens/kakao";
import Nickname from "./screens/Nickname";
import Board from "./screens/board";
import BoardNew from "./screens/boardNew";
import PostDetail from "./screens/PostDetail";
import EditPost from "./screens/EditPost";
import { TouchableOpacity, Alert } from "react-native";
import Entypo from "react-native-vector-icons/Entypo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyPage from "./screens/MyPage";
import Policy from "./screens/Policy";
import PolicyDetail from "./screens/PolicyDetail";
import LikedPosts from "./screens/LikedPosts";
import ChatScreen from "./screens/ChatScreen";
import AssistInfo from "./screens/assistInfo";
import AssistDetail from "./screens/assistDetail";
import ChildCare from "./screens/ChildCare";
import ChildCareNew from "./screens/ChildCareNew";
import ChildCareDetail from "./screens/ChildCareDetail";
import EditCarePost from "./screens/EditCarePost";
import ChatNew from "./screens/ChatNew";
import ChatNewScreen from "./screens/ChatNewScreen";
import WrittenPost from "./screens/WrittenPost";
import Location from "./screens/location";
import ReportList from "./screens/ReportList";
import UserManagement from "./screens/UserManagement";
import CouponWalletScreen from "./screens/CouponWallet";
import PointShopScreen from "./screens/PointShopScreen";
import NoteBox from "./screens/NoteBox";
import CustomActionModal from "./components/CustomActionModal";
import CareList from "./screens/CareList";
import ReviewDetail from "./screens/ReviewDetail";
import Review from "./screens/Review";

const Stack = createStackNavigator();

// 관리자 ID 배열 추가
const ADMIN_IDS = ["3797466405", "3037347547"]; // 여기에 관리자 카카오 ID를 추가하세요

// 새로운 컴포넌트 추가
const PostDetailHeaderRight = ({ navigation, route }) => {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [jwtToken, setJwtToken] = React.useState(null);

  React.useEffect(() => {
    const getToken = async () => {
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        console.log("가져온 JWT 토큰:", token);
        setJwtToken(token);
      } catch (error) {
        console.error("JWT 토큰 가져오기 실패:", error);
      }
    };
    getToken();
  }, []);

  return (
    <>
      <TouchableOpacity
        style={{ marginRight: 15 }}
        onPress={() => setModalVisible(true)}
      >
        <Entypo name="dots-three-vertical" size={20} color="black" />
      </TouchableOpacity>

      <CustomActionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        options={[
          {
            text: "수정하기",
            onPress: async () => {
              try {
                if (!jwtToken) {
                  Alert.alert("오류", "로그인이 필요합니다.");
                  return;
                }
                console.log("수정하기 시작 - postId:", route.params.postId);
                console.log("JWT 토큰:", jwtToken);

                const response = await fetch(
                  `http://3.34.96.14:8080/api/posts/${route.params.postId}`,
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${jwtToken}`,
                    },
                  }
                );

                if (!response.ok) {
                  throw new Error("게시글 정보 가져오기 실패");
                }

                const postData = await response.json();
                navigation.navigate("EditPost", {
                  postId: route.params.postId,
                  title: postData.title,
                  content: postData.content,
                  tags: postData.tags || ["정보"],
                  images: postData.imageUrls || [],
                });
              } catch (error) {
                console.error("게시글 수정 화면 이동 오류:", error);
                Alert.alert("오류", "게시글 정보를 불러올 수 없습니다.");
              }
            },
          },
          {
            text: "삭제하기",
            style: "destructive",
            onPress: () => {
              Alert.alert(
                "게시글 삭제",
                "정말로 이 게시글을 삭제하시겠습니까?",
                [
                  { text: "취소", style: "cancel" },
                  {
                    text: "삭제",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        const deleteResponse = await fetch(
                          `http://3.34.96.14:8080/api/posts/${route.params.postId}`,
                          {
                            method: "DELETE",
                            headers: {
                              Authorization: `Bearer ${jwtToken}`,
                            },
                          }
                        );

                        if (!deleteResponse.ok) {
                          throw new Error("게시글 삭제에 실패했습니다.");
                        }

                        Alert.alert("성공", "게시글이 삭제되었습니다.", [
                          {
                            text: "확인",
                            onPress: () => navigation.navigate("board"),
                          },
                        ]);
                      } catch (error) {
                        console.error("게시글 삭제 오류:", error);
                        Alert.alert("오류", "게시글 삭제에 실패했습니다.");
                      }
                    },
                  },
                ]
              );
            },
          },
          {
            text: "신고하기",
            onPress: async () => {
              try {
                if (!jwtToken) {
                  Alert.alert("오류", "로그인이 필요합니다.");
                  return;
                }

                // 신고 사유 선택 Alert
                Alert.alert("신고 사유 선택", "신고 사유를 선택해주세요", [
                  {
                    text: "비방/욕설",
                    onPress: () => handleReport("비방/욕설"),
                  },
                  {
                    text: "음란",
                    onPress: () => handleReport("음란"),
                  },
                  {
                    text: "스팸/광고",
                    onPress: () => handleReport("스팸/광고"),
                  },
                  {
                    text: "아동 청소년 대상 성범죄",
                    onPress: () => handleReport("아동 청소년 대상 성범죄"),
                  },
                  {
                    text: "불법 상품 및 서비스",
                    onPress: () => handleReport("불법 상품 및 서비스"),
                  },
                  {
                    text: "자살/자해",
                    onPress: () => handleReport("자살/자해"),
                  },
                  {
                    text: "사기/사칭",
                    onPress: () => handleReport("사기/사칭"),
                  },
                  {
                    text: "비정상적인 서비스 이용",
                    onPress: () => handleReport("비정상적인 서비스 이용"),
                  },
                  {
                    text: "기타",
                    onPress: () => {
                      Alert.prompt(
                        "기타 신고 사유",
                        "구체적 신고 사유를 입력해주세요",
                        [
                          {
                            text: "취소",
                            style: "cancel",
                          },
                          {
                            text: "신고",
                            onPress: (reason) => {
                              if (reason && reason.trim()) {
                                handleReport("기타", reason.trim());
                              } else {
                                Alert.alert(
                                  "알림",
                                  "신고 사유를 입력해주세요."
                                );
                              }
                            },
                          },
                        ],
                        "plain-text"
                      );
                    },
                  },
                  {
                    text: "취소",
                    style: "cancel",
                  },
                ]);

                const handleReport = async (reason, customReason = "") => {
                  try {
                    const reportedPosts = await AsyncStorage.getItem(
                      "reportedPosts"
                    );
                    const reportedPostsArray = reportedPosts
                      ? JSON.parse(reportedPosts)
                      : [];

                    const userInfoString = await AsyncStorage.getItem(
                      "userInfo"
                    );
                    const userInfo = JSON.parse(userInfoString);

                    if (
                      reportedPostsArray.some(
                        (report) =>
                          report.postId === route.params.postId &&
                          report.reporterId === userInfo.id
                      )
                    ) {
                      Alert.alert("알림", "이미 신고한 게시글입니다.");
                      return;
                    }

                    const newReport = {
                      postId: route.params.postId,
                      reporterId: userInfo.id,
                      reportedAt: new Date().toISOString(),
                      reportReason: reason,
                      customReason: customReason,
                      status: "pending",
                    };

                    reportedPostsArray.push(newReport);
                    await AsyncStorage.setItem(
                      "reportedPosts",
                      JSON.stringify(reportedPostsArray)
                    );

                    Alert.alert("완료", "신고가 접수되었습니다.");
                  } catch (error) {
                    console.error("신고 처리 오류:", error);
                    Alert.alert("오류", "신고 처리 중 문제가 발생했습니다.");
                  }
                };
              } catch (error) {
                console.error("신고하기 오류:", error);
                Alert.alert("오류", "신고 처리 중 문제가 발생했습니다.");
              }
            },
          },
        ]}
      />
    </>
  );
};

function StackScreen() {
  return (
    <Stack.Navigator
      initialRouteName="KakaoLogin"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Review"
        component={Review}
        options={{
          headerShown: true,
          headerTitle: "리뷰 작성",
          headerBackTitleVisible: true,
          headerBackTitle: "",
          headerBackTitleStyle: {
            color: "black",
            fontWeight: "bold",
          },
          headerTintColor: "black",
        }}
      />
      <Stack.Screen name="KakaoLogin" component={KaKaoLogin} />
      <Stack.Screen name="ChatNew" component={ChatNew} />
      <Stack.Screen name="kakao" component={Kakao} />
      <Stack.Screen name="Nickname" component={Nickname} />
      <Stack.Screen name="board" component={Board} />
      <Stack.Screen
        name="boardNew"
        component={BoardNew}
        options={{
          headerShown: true,
          headerBackTitleVisible: true,
          headerBackTitle: "게시글 작성",
          headerBackTitleStyle: {
            color: "black",
            fontWeight: "bold",
          },
          headerShadowVisible: true,
          headerTitle: "",
          headerTintColor: "black",
        }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetail}
        options={({ navigation, route }) => ({
          headerShown: true,
          headerTitle: "",
          headerBackTitleVisible: false,
          headerBackTitle: "",
          headerBackTitleStyle: {
            color: "black",
            fontWeight: "bold",
          },
          headerTintColor: "black",
          headerRight: () => (
            <PostDetailHeaderRight navigation={navigation} route={route} />
          ),
        })}
      />
      <Stack.Screen
        name="EditPost"
        component={EditPost}
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitleVisible: true,
          headerBackTitle: "게시글 수정",
          headerBackTitleStyle: {
            color: "black",
            fontWeight: "bold",
          },
        }}
      />
      <Stack.Screen
        name="MyPage"
        component={MyPage}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Policy"
        component={Policy}
        options={{
          headerShown: true,
          headerTitle: "약관 및 정책",
          headerBackTitleVisible: true,
          headerBackTitle: "",
          headerBackTitleStyle: {
            color: "black",
            fontWeight: "bold",
          },
          headerTintColor: "black",
        }}
      />
      <Stack.Screen
        name="PolicyDetail"
        component={PolicyDetail}
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitleVisible: true,
          headerBackTitle: "",
          headerBackTitleStyle: {
            color: "black",
            fontWeight: "bold",
          },
          headerTintColor: "black",
        }}
      />
      <Stack.Screen
        name="LikedPosts"
        component={LikedPosts}
        options={{
          headerShown: true,
          headerTitle: "좋아요 한 글",
          headerBackTitleVisible: true,
          headerBackTitle: "",
          headerBackTitleStyle: {
            color: "black",
            fontWeight: "bold",
          },
          headerTintColor: "black",
        }}
      />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{
          headerShown: false,
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="assistInfo"
        component={AssistInfo}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="assistDetail"
        component={AssistDetail}
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitleVisible: true,
          headerBackTitle: "",
          headerBackTitleStyle: {
            color: "black",
            fontWeight: "bold",
          },
          headerTintColor: "black",
        }}
      />
      <Stack.Screen
        name="ChildCare"
        component={ChildCare}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChildCareNew"
        component={ChildCareNew}
        options={{
          headerShown: true,
          headerBackTitleVisible: true,
          headerBackTitle: "자녀돌봄 게시글 작성",
          headerBackTitleStyle: {
            color: "black",
            fontWeight: "bold",
          },
          headerShadowVisible: true,
          headerTitle: "",
          headerTintColor: "black",
        }}
      />
      <Stack.Screen
        name="ChildCareDetail"
        component={ChildCareDetail}
        options={({ route, navigation }) => ({
          headerShown: true,
          headerTitle: "",
          headerBackTitleVisible: true,
          headerBackTitle: "",
          headerBackTitleStyle: {
            color: "black",
            fontWeight: "bold",
          },
          headerTintColor: "black",
          headerRight: () => (
            <TouchableOpacity
              onPress={async () => {
                try {
                  const userInfoString = await AsyncStorage.getItem("userInfo");
                  const jwtToken = await AsyncStorage.getItem("jwtToken");

                  if (!userInfoString || !jwtToken) {
                    Alert.alert("알림", "로그인이 필요합니다.");
                    navigation.navigate("KakaoLogin");
                    return;
                  }

                  const userInfo = JSON.parse(userInfoString);
                  const options = [
                    {
                      text: "수정하기",
                      onPress: () => {
                        navigation.navigate("EditCarePost", {
                          carePostId: route.params.carePostId,
                        });
                      },
                    },
                    {
                      text: "삭제하기",
                      style: "destructive",
                      onPress: () => {
                        Alert.alert(
                          "게시글 삭제",
                          "정말로 이 게시글을 삭제하시겠습니까?",
                          [
                            { text: "취소", style: "cancel" },
                            {
                              text: "삭제",
                              style: "destructive",
                              onPress: async () => {
                                try {
                                  const deleteResponse = await fetch(
                                    `http://3.34.96.14:8080/api/carePosts/${route.params.carePostId}`,
                                    {
                                      method: "DELETE",
                                      headers: {
                                        Authorization: `Bearer ${jwtToken}`,
                                      },
                                    }
                                  );

                                  if (!deleteResponse.ok) {
                                    throw new Error(
                                      "게시글 삭제에 실패했습니다."
                                    );
                                  }

                                  Alert.alert(
                                    "성공",
                                    "게시글이 삭제되었습니다.",
                                    [
                                      {
                                        text: "확인",
                                        onPress: () =>
                                          navigation.navigate("ChildCare"),
                                      },
                                    ]
                                  );
                                } catch (error) {
                                  console.error("게시글 삭제 오류:", error);
                                  Alert.alert(
                                    "오류",
                                    "게시글 삭제에 실��했습니다."
                                  );
                                }
                              },
                            },
                          ]
                        );
                      },
                    },
                    {
                      text: "신고하기",
                      onPress: () => {
                        Alert.alert(
                          "신고 사유 선택",
                          "신고 사유를 선택해주세요",
                          [
                            {
                              text: "비방/욕설",
                              onPress: () => handleReport("비방/욕설"),
                            },
                            {
                              text: "음란",
                              onPress: () => handleReport("음란"),
                            },
                            {
                              text: "스팸/광고",
                              onPress: () => handleReport("스팸/광광고"),
                            },
                            {
                              text: "아동 청소년 대상 성범죄",
                              onPress: () =>
                                handleReport("아동 청소년 대상 성범죄"),
                            },
                            {
                              text: "불법 상품 및 서비스",
                              onPress: () =>
                                handleReport("불법 상품 및 서비스"),
                            },
                            {
                              text: "자살/자해",
                              onPress: () => handleReport("자살/자해"),
                            },
                            {
                              text: "사기/사칭",
                              onPress: () => handleReport("사기/사칭"),
                            },
                            {
                              text: "비정상적인 서비스 이용",
                              onPress: () =>
                                handleReport("비정상적인 서비스 이용"),
                            },
                            {
                              text: "기타",
                              onPress: () => {
                                Alert.prompt(
                                  "기타 신고 사유",
                                  "구체적 신고 사유를 입력해주세요",
                                  [
                                    {
                                      text: "취소",
                                      style: "cancel",
                                    },
                                    {
                                      text: "신고",
                                      onPress: (reason) => {
                                        if (reason && reason.trim()) {
                                          handleReport("기타", reason.trim());
                                        } else {
                                          Alert.alert(
                                            "알림",
                                            "신고 사유를 입력해주세요."
                                          );
                                        }
                                      },
                                    },
                                  ],
                                  "plain-text"
                                );
                              },
                            },
                            {
                              text: "취소",
                              style: "cancel",
                            },
                          ]
                        );

                        const handleReport = async (
                          reason,
                          customReason = ""
                        ) => {
                          try {
                            const reportedPosts = await AsyncStorage.getItem(
                              "reportedPosts"
                            );
                            const reportedPostsArray = reportedPosts
                              ? JSON.parse(reportedPosts)
                              : [];

                            if (
                              reportedPostsArray.some(
                                (report) =>
                                  report.postId === route.params.carePostId &&
                                  report.reporterId === userInfo.id
                              )
                            ) {
                              Alert.alert("알림", "이미 신고한 게시글입니다.");
                              return;
                            }

                            const newReport = {
                              postId: route.params.carePostId,
                              reporterId: userInfo.id,
                              reportedAt: new Date().toISOString(),
                              reportReason: reason,
                              customReason: customReason,
                              status: "pending",
                            };

                            reportedPostsArray.push(newReport);
                            await AsyncStorage.setItem(
                              "reportedPosts",
                              JSON.stringify(reportedPostsArray)
                            );

                            Alert.alert("완료", "신고가 접수되었습니다.");
                          } catch (error) {
                            console.error("신고 처리 오류:", error);
                            Alert.alert(
                              "오류",
                              "신고 처리 중 문제가 발생했습니다."
                            );
                          }
                        };
                      },
                    },
                    {
                      text: "취소",
                      style: "cancel",
                    },
                  ];

                  Alert.alert("게시글 관리", "선택해주세요", options);
                } catch (error) {
                  console.error("게시글 관리 오류:", error);
                  Alert.alert("오류", "작업을 수행할 수 없습니다.");
                }
              }}
            >
              <Entypo name="dots-three-vertical" size={20} color="black" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="EditCarePost"
        component={EditCarePost}
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitleVisible: true,
          headerBackTitle: "게시글 수정",
          headerBackTitleStyle: {
            color: "black",
            fontWeight: "bold",
          },
          headerTintColor: "black",
        }}
      />
      <Stack.Screen
        name="ChatNewScreen"
        component={ChatNewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WrittenPost"
        component={WrittenPost}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="Location"
        component={Location}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="ReportList"
        component={ReportList}
        options={{
          headerShown: true,
          headerTitle: "신고 내역",
          headerBackTitleVisible: true,
          headerBackTitle: "",
          headerTintColor: "black",
        }}
      />
      <Stack.Screen
        name="UserManagement"
        component={UserManagement}
        options={{
          headerShown: true,
          headerTitle: "사용자 관리",
          headerBackTitleVisible: true,
          headerBackTitle: "",
          headerTintColor: "black",
        }}
      />
      <Stack.Screen
        name="CouponWallet"
        component={CouponWalletScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PointShopScreen"
        component={PointShopScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NoteBox"
        component={NoteBox}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CareList"
        component={CareList}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReviewDetail"
        component={ReviewDetail}
        options={{
          headerShown: true,
          headerTitle: "받은 후기",
          headerBackTitleVisible: true,
          headerBackTitle: "",
          headerTintColor: "black",
        }}
      />
    </Stack.Navigator>
  );
}

function Navigation() {
  return <StackScreen />;
}

export default Navigation;
