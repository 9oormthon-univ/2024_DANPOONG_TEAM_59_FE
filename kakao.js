import React, { useState } from "react";
import { View, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";

const REST_API_KEY = "0da6943dbdb9d9e7335d373903e6f350";
const REDIRECT_URI = encodeURIComponent("http://192.168.45.146:19006/Home");

const KaKaoLogin = () => {
  const navigation = useNavigation();
  const [hasNavigated, setHasNavigated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const webviewRef = React.useRef(null);

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

          navigation.replace("Nickname", { authCode: code });
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
