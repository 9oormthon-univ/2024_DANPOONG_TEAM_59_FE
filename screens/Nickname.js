import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Nickname = ({ route }) => {
  const { userInfo, accessToken } = route.params || {};
  const [nickname, setNickname] = useState(
    userInfo?.kakao_account?.profile?.nickname || ""
  );
  const [error, setError] = useState("");
  const [jwtToken, setJwtToken] = useState("");
  const [isPrivacyChecked, setIsPrivacyChecked] = useState(false);
  const [isTermsChecked, setIsTermsChecked] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const getToken = async () => {
      try {
        console.log("[토큰 조회 시작]");
        const token = await AsyncStorage.getItem("jwtToken");

        if (token) {
          console.log("[토큰 존재]", { tokenLength: token.length });
          setJwtToken(token);
        } else {
          console.log("[토큰 없음] AsyncStorage에 토큰을 찾을 수 없습니다.");
          // 토큰이 없는 경우 로그인 페이지로 리다이렉트
          navigation.replace("KakaoLogin");
        }
      } catch (error) {
        console.error("[토큰 조회 실패]", {
          error: error.message,
          stack: error.stack,
        });
        Alert.alert("오류", "토큰 정보를 가져오는데 실패했습니다.");
        navigation.replace("KakaoLogin");
      }
    };

    getToken();
  }, [navigation]);

  const handleNext = async () => {
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요!");
      return;
    }

    if (!isPrivacyChecked || !isTermsChecked) {
      setError("모든 약관에 동의해주세요!");
      return;
    }

    try {
      if (!jwtToken) {
        console.error("[토큰 없음] 닉네임 설정 불가");
        throw new Error("인증 토큰이 없습니다.");
      }

      console.log("[닉네임 설정 요청]", {
        nickname: nickname.trim(),
        tokenExists: !!jwtToken,
      });

      const response = await fetch(
        "http://3.34.96.14:8080/api/member/nickname",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
            nickname: nickname.trim(),
          }),
        }
      );

      // 응답 상태 확인
      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      // 성공시에만 Location 페이지로 이동
      setError("");
      navigation.navigate("Location");
    } catch (error) {
      console.error("[닉네임 설정 오류]", {
        message: error.message,
        token: jwtToken ? "토큰 존재" : "토큰 없음",
        type: error.name,
        stack: error.stack,
      });
      setError("닉네임 설정 중 오류가 발생했습니다.");
      Alert.alert("오류", "닉네임 설정에 실패했습니다.");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/background.png")}
        style={styles.backgroundImage}
      />
      <Text style={styles.NicknameText}>
        앱에서 사용하실{"\n"}닉네임을 입력해주세요.
      </Text>
      <Text style={styles.SubText}>
        닉네임은 마이페이지에서{"\n"}변경이 가능합니다.
      </Text>
      <Image source={require("../assets/logo2.png")} style={styles.logo2} />
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        maxLength={15}
        value={nickname}
        onChangeText={(text) => {
          setNickname(text);
          setError("");
        }}
        placeholder="닉네임을 입력하세요"
      />

      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setIsPrivacyChecked(!isPrivacyChecked)}
        >
          <View style={[styles.checkbox, isPrivacyChecked && styles.checked]}>
            {isPrivacyChecked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={styles.checkboxTextContainer}>
            <Text style={styles.checkboxText}>
              개인정보 처리방침 동의 (필수)
            </Text>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  "https://strong-quail-f1b.notion.site/983b2e0685dc461cb94779df818e962c"
                )
              }
            >
              <Text style={styles.linkText}>더보기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setIsTermsChecked(!isTermsChecked)}
        >
          <View style={[styles.checkbox, isTermsChecked && styles.checked]}>
            {isTermsChecked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <View style={styles.checkboxTextContainer}>
            <Text style={styles.checkboxText}>앱 이용약관 동의 (필수)</Text>
            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  "https://strong-quail-f1b.notion.site/5d3a16ffabea4109a22956b1cb7a4bbe"
                )
              }
            >
              <Text style={styles.linkText}>더보기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleNext}
          style={[
            styles.PreBottom,
            (!isPrivacyChecked || !isTermsChecked || !nickname.trim()) &&
              styles.disabledButton,
          ]}
          disabled={!isPrivacyChecked || !isTermsChecked || !nickname.trim()}
        >
          <Text
            style={[
              styles.BottomText,
              (!isPrivacyChecked || !isTermsChecked || !nickname.trim()) &&
                styles.disabledButtonText,
            ]}
          >
            다음
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Nickname;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  NicknameText: {
    fontSize: 30,
    marginTop: "40%",
    marginLeft: 28,
    fontWeight: "bold",
  },
  SubText: {
    fontSize: 15,
    marginLeft: 28,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#FFECA1",
    backgroundColor: "#FFFFFF",
    padding: 10,
    margin: 10,
    width: "75%",
    alignSelf: "center",
    borderRadius: 10,
  },
  logo2: {
    width: 150,
    height: 150,
    marginTop: 110,
    marginBottom: 45,
    alignSelf: "center",
  },
  PreBottom: {
    backgroundColor: "#FFEDAE",
    padding: 10,
    marginTop: "10%",
    width: "110%",
    height: 200,
    alignSelf: "center",
    borderRadius: 10,
  },
  disabledButton: {
    backgroundColor: "#E5E5E5", // 비활성화됐을 때의 배경색
    opacity: 0.7,
  },
  BottomText: {
    fontSize: 15,
    color: "#E78B00",
    textAlign: "center",
    fontWeight: "bold",
    paddingTop: 15,
  },
  disabledButtonText: {
    color: "#999999", // 비활성화됐을 때의 텍스트 색상
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 5,
  },
  checkboxContainer: {
    marginTop: 10,
    marginBottom: 10,
    alignSelf: "center",
    width: "75%",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#E78B00",
    marginRight: 10,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  checked: {
    backgroundColor: "#E78B00",
  },
  checkmark: {
    color: "white",
    fontSize: 14,
  },
  checkboxText: {
    fontSize: 14,
    color: "#333",
  },
  checkboxTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  linkText: {
    color: "#E78B00",
    textDecorationLine: "underline",
    marginLeft: 10,
    fontSize: 12,
  },
});
