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
const Stack = createStackNavigator();

function StackScreen() {
  return (
    <Stack.Navigator
      initialRouteName="KakaoLogin"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="KakaoLogin" component={KaKaoLogin} />
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
          headerBackTitleVisible: true,
          headerBackTitle: "",
          headerBackTitleStyle: {
            color: "black",
            fontWeight: "bold",
          },
          headerTintColor: "black",
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 15 }}
              onPress={() => {
                Alert.alert("게시글 관리", "원하시는 작업을 선택해주세요", [
                  {
                    text: "수정하기",
                    onPress: async () => {
                      try {
                        const jwtToken = await AsyncStorage.getItem("jwtToken");

                        if (!jwtToken) {
                          Alert.alert("인증 오류", "로그인이 필요합니다.");
                          navigation.navigate("KakaoLogin");
                          return;
                        }

                        // 서버에서 현재 게시글 정보 확인
                        const response = await fetch(
                          `http://192.168.61.45:8080/api/posts/${route.params.postId}`,
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
                          if (response.status === 404) {
                            Alert.alert("오류", "게시글을 찾을 수 없습니다.");
                            navigation.navigate("board");
                            return;
                          }
                          Alert.alert(
                            "오류",
                            "게시글 정보를 불러올 수 없습니다."
                          );
                          return;
                        }

                        const postData = await response.json();

                        // 작성자 확인 및 수정 화면으로 이동
                        navigation.navigate("EditPost", {
                          postId: route.params.postId,
                          postData: postData,
                        });
                      } catch (error) {
                        console.error("게시글 수정 초기화 오류:", error);
                        Alert.alert(
                          "오류",
                          "게시글 수정을 시작할 수 없습니다."
                        );
                      }
                    },
                  },
                  {
                    text: "삭제하기",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        const jwtToken = await AsyncStorage.getItem("jwtToken");

                        if (!jwtToken) {
                          Alert.alert("인증 오류", "로그인이 필요합니다.");
                          navigation.navigate("KakaoLogin");
                          return;
                        }

                        // 서버에서 현재 게시글 정보 확인
                        const response = await fetch(
                          `http://192.168.61.45:8080/api/posts/${route.params.postId}`,
                          {
                            method: "GET",
                            headers: {
                              Authorization: `Bearer ${jwtToken}`,
                              "Content-Type": "application/json",
                            },
                          }
                        );

                        if (!response.ok) {
                          Alert.alert(
                            "오류",
                            "게시글 정보를 불러올 수 없습니다."
                          );
                          return;
                        }

                        const postData = await response.json();
                        console.log("현재 게시글 정보:", postData);

                        Alert.alert(
                          "게시글 삭제",
                          "정말로 이 게시글을 삭제하시겠습니까?",
                          [
                            {
                              text: "취소",
                              style: "cancel",
                            },
                            {
                              text: "삭제",
                              onPress: async () => {
                                try {
                                  console.log("삭제 요청 시작:", {
                                    postId: route.params.postId,
                                    memberId: postData.memberId,
                                  });

                                  const deleteResponse = await fetch(
                                    `http://192.168.61.45:8080/api/posts/${route.params.postId}`,
                                    {
                                      method: "DELETE",
                                      headers: {
                                        Authorization: `Bearer ${jwtToken}`,
                                        "Content-Type": "application/json",
                                      },
                                    }
                                  );

                                  const responseText =
                                    await deleteResponse.text();
                                  console.log("삭제 응답:", {
                                    status: deleteResponse.status,
                                    text: responseText,
                                  });

                                  if (!deleteResponse.ok) {
                                    if (deleteResponse.status === 401) {
                                      Alert.alert(
                                        "인증 만료",
                                        "다시 로그인해주세요."
                                      );
                                      navigation.navigate("KakaoLogin");
                                      return;
                                    }
                                    if (deleteResponse.status === 403) {
                                      Alert.alert(
                                        "권한 없음",
                                        "게시글 작성자만 삭제할 수 있습니다."
                                      );
                                      return;
                                    }
                                    if (deleteResponse.status === 404) {
                                      Alert.alert(
                                        "오류",
                                        "게시글을 찾을 수 없습니다."
                                      );
                                      navigation.navigate("board");
                                      return;
                                    }
                                    throw new Error(
                                      responseText ||
                                        "게시글 삭제에 실패했습니다."
                                    );
                                  }

                                  Alert.alert(
                                    "성공",
                                    "게시글이 삭제되었습니다.",
                                    [
                                      {
                                        text: "확인",
                                        onPress: () => {
                                          console.log(
                                            "게시글 삭제 완료, 게시판으로 이동"
                                          );
                                          navigation.navigate("board");
                                        },
                                      },
                                    ]
                                  );
                                } catch (error) {
                                  console.error(
                                    "게시글 삭제 처리 중 상세 오류:",
                                    error
                                  );
                                  Alert.alert(
                                    "오류",
                                    "게시글 삭제 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요."
                                  );
                                }
                              },
                              style: "destructive",
                            },
                          ]
                        );
                      } catch (error) {
                        console.error("게시글 삭제 오기화 오류:", error);
                        Alert.alert(
                          "오류",
                          "게시글 삭제를 시작할 수 없습니다."
                        );
                      }
                    },
                  },
                  {
                    text: "취소",
                    style: "cancel",
                  },
                ]);
              }}
            >
              <Entypo name="dots-three-vertical" size={20} color="black" />
            </TouchableOpacity>
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
        name="ChildCareDetail"
        component={ChildCareDetail}
        options={({ navigation, route }) => ({
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
              style={{ marginRight: 15 }}
              onPress={() => {
                Alert.alert("게시글 관리", "원하시는 작업을 선택해주세요", [
                  {
                    text: "수정하기",
                    onPress: async () => {
                      try {
                        const jwtToken = await AsyncStorage.getItem("jwtToken");
                        console.log("route.params:", route.params);
                        const carePostId = route.params?.postId;

                        if (!carePostId) {
                          throw new Error("게시글 ID를 찾을 수 없습니다");
                        }

                        if (!jwtToken) {
                          Alert.alert("인증 오류", "로그인이 필요합니다.");
                          navigation.navigate("KakaoLogin");
                          return;
                        }

                        const response = await fetch(
                          `http://192.168.61.45:8080/api/carePosts/${carePostId}`,
                          {
                            method: "GET",
                            headers: {
                              Authorization: `Bearer ${jwtToken}`,
                              "Content-Type": "application/json",
                            },
                          }
                        );

                        console.log("2. 요청 URL:", response.url);
                        console.log("3. 서버 응답 상태:", response.status);

                        if (!response.ok) {
                          throw new Error("게시글을 불러오는데 실패했습니다");
                        }

                        const data = await response.json();
                        console.log("4. 받은 데이터:", data);

                        // 수정 화면으로 이동
                        navigation.navigate("EditCarePost", {
                          carePostId: carePostId,
                          postData: data,
                        });
                      } catch (error) {
                        console.error("게시글 수정 초기화 오류:", error);
                        Alert.alert(
                          "오류",
                          error.message || "게시글 수정을 시작할 수 없습니다."
                        );
                      }
                    },
                  },
                  {
                    text: "삭제하기",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        const jwtToken = await AsyncStorage.getItem("jwtToken");

                        if (!jwtToken) {
                          Alert.alert("인증 오류", "로그인이 필요합니다.");
                          navigation.navigate("KakaoLogin");
                          return;
                        }

                        // API 엔드포인트 수정
                        const response = await fetch(
                          `http://192.168.61.45:8080/api/carePosts/${route.params.postId}`,
                          {
                            method: "GET",
                            headers: {
                              Authorization: `Bearer ${jwtToken}`,
                              "Content-Type": "application/json",
                            },
                          }
                        );

                        if (!response.ok) {
                          Alert.alert(
                            "오류",
                            "게시글 정보를 불러올 수 없습니다."
                          );
                          return;
                        }

                        const postData = await response.json();
                        console.log("현재 게시글 정보:", postData);

                        Alert.alert(
                          "게시글 삭제",
                          "정말로 이 게시글을 삭제하시겠습니까?",
                          [
                            {
                              text: "취소",
                              style: "cancel",
                            },
                            {
                              text: "삭제",
                              onPress: async () => {
                                try {
                                  console.log("삭제 요청 시작:", {
                                    postId: route.params.postId,
                                    memberId: postData.memberId,
                                  });

                                  // 삭제 API 엔드포인트 수정
                                  const deleteResponse = await fetch(
                                    `http://192.168.61.45:8080/api/carePosts/${route.params.postId}`,
                                    {
                                      method: "DELETE",
                                      headers: {
                                        Authorization: `Bearer ${jwtToken}`,
                                        "Content-Type": "application/json",
                                      },
                                    }
                                  );

                                  const responseText =
                                    await deleteResponse.text();
                                  console.log("삭제 응답:", {
                                    status: deleteResponse.status,
                                    text: responseText,
                                  });

                                  if (!deleteResponse.ok) {
                                    if (deleteResponse.status === 401) {
                                      Alert.alert(
                                        "인증 만료",
                                        "다시 로그인해주세요."
                                      );
                                      navigation.navigate("KakaoLogin");
                                      return;
                                    }
                                    if (deleteResponse.status === 403) {
                                      Alert.alert(
                                        "권한 없음",
                                        "게시글 작성자만 삭제할 수 있습니다."
                                      );
                                      return;
                                    }
                                    if (deleteResponse.status === 404) {
                                      Alert.alert(
                                        "오류",
                                        "게시글을 찾을 수 없습니다."
                                      );
                                      navigation.navigate("board");
                                      return;
                                    }
                                    throw new Error(
                                      responseText ||
                                        "게시글 삭제에 실패했습니다."
                                    );
                                  }

                                  Alert.alert(
                                    "성공",
                                    "게시글이 삭제되었습니다.",
                                    [
                                      {
                                        text: "확인",
                                        onPress: () => {
                                          console.log(
                                            "게시글 삭제 완료, 게시판으로 이동"
                                          );
                                          navigation.navigate("board");
                                        },
                                      },
                                    ]
                                  );
                                } catch (error) {
                                  console.error(
                                    "게시글 삭제 처리 중 상세 오류:",
                                    error
                                  );
                                  Alert.alert(
                                    "오류",
                                    "게시글 삭제 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요."
                                  );
                                }
                              },
                              style: "destructive",
                            },
                          ]
                        );
                      } catch (error) {
                        console.error("게시글 삭제 오기화 오류:", error);
                        Alert.alert(
                          "오류",
                          "게시글 삭제를 시작할 수 없습니다."
                        );
                      }
                    },
                  },
                  {
                    text: "취소",
                    style: "cancel",
                  },
                ]);
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
        name="ChatNew"
        component={ChatNew}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatNewScreen"
        component={ChatNewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="WrittenPost" component={WrittenPost} />
    </Stack.Navigator>
  );
}

function Navigation() {
  return <StackScreen />;
}

export default Navigation;
