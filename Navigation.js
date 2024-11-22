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
                        // 현재 사용자 닉네임 가져오기
                        const userNickname = await AsyncStorage.getItem(
                          "userNickname"
                        );
                        // 게시글 정보 가져오기
                        const savedPosts = await AsyncStorage.getItem("posts");
                        const posts = JSON.parse(savedPosts);
                        const post = posts.find(
                          (p) => p.id === route.params.postId
                        );

                        // 작성자 확인
                        if (post.author === userNickname) {
                          navigation.navigate("EditPost", {
                            postId: route.params.postId,
                          });
                        } else {
                          Alert.alert(
                            "알림",
                            "게시글 작성자만 수정할 수 있습니다."
                          );
                        }
                      } catch (error) {
                        console.error("게시글 수정 권한 확인 오류:", error);
                        Alert.alert(
                          "오류",
                          "게시글 수정 권한을 확인하는 중 오류가 발생했습니다."
                        );
                      }
                    },
                  },
                  {
                    text: "삭제하기",
                    style: "destructive",
                    onPress: () => {
                      Alert.alert(
                        "삭제 확인",
                        "정말로 이 게시글을 삭제하시겠습니까?",
                        [
                          {
                            text: "취소",
                            style: "cancel",
                          },
                          {
                            text: "삭제",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                // AsyncStorage에서 게시글 목록 가져오기
                                const savedPosts = await AsyncStorage.getItem(
                                  "posts"
                                );
                                if (savedPosts) {
                                  const posts = JSON.parse(savedPosts);
                                  // 현재 게시글을 제외한 새로운 배열 생성
                                  const updatedPosts = posts.filter(
                                    (post) => post.id !== route.params.postId
                                  );

                                  // 업데이트된 게시글 목록 저장
                                  await AsyncStorage.setItem(
                                    "posts",
                                    JSON.stringify(updatedPosts)
                                  );

                                  Alert.alert(
                                    "성공",
                                    "게시글이 삭제되었습니다.",
                                    [
                                      {
                                        text: "확인",
                                        onPress: () =>
                                          navigation.navigate("board"),
                                      },
                                    ]
                                  );
                                }
                              } catch (error) {
                                console.error("게시글 삭제 오류:", error);
                                Alert.alert(
                                  "오류",
                                  "게시글 삭제 중 오류가 발생했습니다."
                                );
                              }
                            },
                          },
                        ]
                      );
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
          headerShown: true,
          headerTitle: "마이페이지",
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
    </Stack.Navigator>
  );
}

function Navigation() {
  return <StackScreen />;
}

export default Navigation;
