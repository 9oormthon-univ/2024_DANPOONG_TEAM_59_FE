import React, { useState } from "react";
import { View, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const REST_API_KEY = "0da6943dbdb9d9e7335d373903e6f350";
const REDIRECT_URI = encodeURIComponent("http://192.168.61.174:19006/Home");

const KaKaoLogin = () => {
  const navigation = useNavigation();
  const [hasNavigated, setHasNavigated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const webviewRef = React.useRef(null);

  const getToken = async (code) => {
    try {
      console.log("[토큰 요청 시작]", { code, REDIRECT_URI });

      const tokenRequest = await fetch("https://kauth.kakao.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=authorization_code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&code=${code}`,
      });

      console.log("[토큰 요청 응답 상태]", {
        status: tokenRequest.status,
        ok: tokenRequest.ok,
      });

      if (!tokenRequest.ok) {
        const errorText = await tokenRequest.text();
        console.error("[토큰 요청 실패]", {
          status: tokenRequest.status,
          error: errorText,
        });
        throw new Error(`토큰 요청 실패: ${tokenRequest.status}, ${errorText}`);
      }

      const tokenResponse = await tokenRequest.json();
      console.log("토큰 응답:", tokenResponse);

      if (tokenResponse.access_token) {
        const userInfoResponse = await fetch(
          "https://kapi.kakao.com/v2/user/me",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        const userInfo = await userInfoResponse.json();
        console.log("사용자 정보:", userInfo);

        // 서버에 사용자 정보 전송
        try {
          console.log("[서버 요청 시작]", {
            userId: userInfo.id,
            email: userInfo.kakao_account?.email,
            nickname: userInfo.properties?.nickname,
          });

          const serverResponse = await fetch(
            "http://3.34.96.14:8080/api/auth/kakao/callback",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: userInfo.id,
                connected_at: new Date().toISOString(),
                email: userInfo.kakao_account?.email || "",
                nickname: userInfo.properties?.nickname || "",
                profile_image_url: userInfo.properties?.profile_image || "",
              }),
            }
          );

          console.log("[서버 응답 상태]", {
            status: serverResponse.status,
            ok: serverResponse.ok,
          });

          if (!serverResponse.ok) {
            const errorText = await serverResponse.text();
            console.error("[서버 응답 실패]", {
              status: serverResponse.status,
              error: errorText,
            });
            throw new Error(
              `서버 응답 오류: ${serverResponse.status}, ${errorText}`
            );
          }

          const serverData = await serverResponse.json();
          console.log("서버 응답:", serverData);

          // JWT 토큰 저장 추가
          if (serverData.token) {
            await AsyncStorage.setItem("jwtToken", serverData.token);
            console.log("JWT 토큰 저장 완료");
          }
        } catch (error) {
          console.error("[서버 통신 상세 에러]", {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
          Alert.alert("오류", "서버와의 통신에 실패했습니다.");
        }

        // AsyncStorage에 사용자 정보와 토큰 저장
        try {
          await AsyncStorage.setItem("userInfo", JSON.stringify(userInfo));
          await AsyncStorage.setItem("accessToken", tokenResponse.access_token);
          await AsyncStorage.setItem(
            "refreshToken",
            tokenResponse.refresh_token
          );
          console.log("사용자 정보 및 토큰 저장 완료");
        } catch (error) {
          console.error("데이터 저장 실패:", error);
        }

        navigation.replace("Nickname", {
          authCode: code,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          userInfo: userInfo,
        });
      } else {
        Alert.alert("오류", "토큰을 받아오는데 실패했습니다.");
        navigation.goBack();
      }
    } catch (error) {
      console.error("[전체 프로세스 에러]", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      Alert.alert("오류", "카카오 로그인 처리 중 오류가 발생했습니다.");
      navigation.goBack();
    }
  };

  const handleNavigationStateChange = (navState) => {
    try {
      console.log("현재 URL:", navState.url);
      setIsLoading(navState.loading);

      if (navState.url.includes("code=")) {
        const match = navState.url.match(/code=([^&]+)/);
        if (match && !hasNavigated) {
          const code = match[1];
          console.log("인증 코드:", code);
          setHasNavigated(true);

          getToken(code);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error("인증 처리 중 오류:", error);
      return false;
    }
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.warn("WebView 에러:", nativeEvent);

    if (hasNavigated) {
      return;
    }

    if (nativeEvent.code === -1004) {
      Alert.alert(
        "연결 오류",
        "서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.",
        [
          {
            text: "다시 시도",
            onPress: () => {
              if (webviewRef.current) {
                webviewRef.current.reload();
              }
            },
          },
          {
            text: "취소",
            style: "cancel",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        style={styles.webview}
        source={{
          uri: `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}`,
        }}
        onError={handleError}
        onHttpError={(syntheticEvent) => {
          if (hasNavigated) return;

          const { nativeEvent } = syntheticEvent;
          console.warn(`HTTP 에러: ${nativeEvent.statusCode}`);
        }}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        thirdPartyCookiesEnabled={true}
        originWhitelist={["*"]}
        onNavigationStateChange={handleNavigationStateChange}
        cacheEnabled={false}
        incognito={true}
      />
      {isLoading && !hasNavigated && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
});

export default KaKaoLogin;
