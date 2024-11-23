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
      console.log("인증 코드로 토큰 요청:", code);

      const tokenRequest = await fetch("https://kauth.kakao.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=authorization_code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&code=${code}`,
      });

      if (!tokenRequest.ok) {
        throw new Error(`토큰 요청 실패: ${tokenRequest.status}`);
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

        const serverResponse = await sendUserInfoToServer(
          userInfo,
          tokenResponse.access_token
        );
        const jwtToken = serverResponse.token;

        // JWT 토큰을 AsyncStorage에 저장
        try {
          await AsyncStorage.setItem("jwtToken", jwtToken);
          console.log("JWT 토큰 저장 완료:", jwtToken);
        } catch (error) {
          console.error("JWT 토큰 저장 실패:", error);
        }

        navigation.replace("Nickname", {
          authCode: code,
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token,
          userInfo: userInfo,
          jwtToken: jwtToken,
        });
      } else {
        Alert.alert("오류", "토큰을 받아오는데 실패했습니다.");
        navigation.goBack();
      }
    } catch (error) {
      console.error("토큰 요청 중 오류:", error);
      Alert.alert("오류", "토큰을 받아오는데 실패했습니다.");
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

  const sendUserInfoToServer = async (userInfo, accessToken) => {
    try {
      const baseUrl = `http://192.168.61.45:8080/api/auth/kakao/callback`;

      // 요청 데이터 로깅
      console.log("=== 서버 요청 정보 ===");
      console.log("1. 요청 URL:", baseUrl);
      console.log("2. 액세스 토큰:", accessToken);

      const requestBody = {
        id: userInfo.id,
        connected_at: userInfo.connected_at,
        email: userInfo.kakao_account?.email || "",
        nickname: userInfo.kakao_account?.profile?.nickname || "",
        profile_image_url:
          userInfo.kakao_account?.profile?.profile_image_url || "",
      };

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`, // Authorization 헤더로 변경
        },
        body: JSON.stringify(requestBody),
      });

      console.log("서버 응답 상태:", response.status);
      const responseText = await response.text();
      console.log("서버 응답 내용:", responseText);

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status} - ${responseText}`);
      }

      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      console.error("서버 통신 상세 오류:", error);
      throw error;
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
