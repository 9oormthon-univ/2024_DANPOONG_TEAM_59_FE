import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Nickname = ({ route }) => {
  const { userInfo, accessToken, jwtToken } = route.params || {};
  const [nickname, setNickname] = useState(
    userInfo?.kakao_account?.profile?.nickname || ""
  );
  const [error, setError] = useState("");

  const navigation = useNavigation();

  const updateNickname = async () => {
    try {
      const baseUrl =
        process.env.SERVER_URL ||
        "http://192.168.61.45:8080/api/member/nickname";

      // AsyncStorage에서 토큰들을 가져옵니다
      const kakaoToken = await AsyncStorage.getItem("kakaoToken");
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      const userInfo = await AsyncStorage.getItem("userInfo");

      if (!kakaoToken || !jwtToken) {
        throw new Error("인증 토큰이 없습니다.");
      }

      const parsedUserInfo = userInfo ? JSON.parse(userInfo) : null;

      // 요청 데이터 준비
      const requestData = {
        kakaoId: parsedUserInfo?.id,
        nickname: nickname.trim(),
        email: parsedUserInfo?.email,
        profileImage: parsedUserInfo?.profileImage,
      };

      console.log("요청 URL:", baseUrl);
      console.log("전송할 데이터:", requestData);
      console.log("JWT 토큰:", jwtToken);
      console.log("카카오 토큰:", kakaoToken);

      const response = await fetch(baseUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
          "X-Kakao-Token": kakaoToken,
          Accept: "application/json",
        },
        body: JSON.stringify(requestData),
      });

      console.log("서버 응답 상태:", response.status);
      const responseText = await response.text();
      console.log("서버 응답 내용:", responseText);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        }

        // 응답 텍스트가 JSON 형식인 경우 파싱
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || "닉네임 업데이트에 실패했습니다.";
        } catch (e) {
          errorMessage = responseText || "닉네임 업데이트에 실패했습니다.";
        }
        throw new Error(errorMessage);
      }

      // 닉네임을 AsyncStorage에 저장
      await AsyncStorage.setItem("userNickname", nickname.trim());

      // userInfo 업데이트
      if (parsedUserInfo) {
        parsedUserInfo.nickname = nickname.trim();
        await AsyncStorage.setItem("userInfo", JSON.stringify(parsedUserInfo));
      }

      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      console.error("닉네임 업데이트 상세 오류:", error);
      throw error;
    }
  };

  const handleNext = async () => {
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요!");
      return;
    }

    // 닉네임 유효성 검사
    if (nickname.length < 2 || nickname.length > 10) {
      setError("닉네임은 2자 이상 10자 이하로 입력해주세요.");
      return;
    }

    if (!/^[가-힣a-zA-Z0-9]+$/.test(nickname)) {
      setError("닉네임은 한글, 영문, 숫자만 사용 가능합니다.");
      return;
    }

    try {
      await updateNickname();
      setError("");

      Alert.alert("성공", "닉네임이 성공적으로 설정되었습니다.", [
        {
          text: "확인",
          onPress: () => navigation.navigate("board"),
        },
      ]);
    } catch (error) {
      console.error("처리 중 오류 발생:", error);

      if (error.message.includes("인증이 만료")) {
        Alert.alert("인증 만료", "다시 로그인해주세요.", [
          {
            text: "확인",
            onPress: () => navigation.navigate("KakaoLogin"),
          },
        ]);
      } else {
        setError(error.message);
        Alert.alert("오류", error.message, [
          {
            text: "확인",
            style: "cancel",
          },
        ]);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.NicknameText}>닉네임을 입력해주세요.</Text>
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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate("KakaoLogin")}
          style={styles.PreBottom}
        >
          <Text style={styles.BottomText}>이전</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} style={styles.NextBottom}>
          <Text style={styles.BottomText}>다음</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Nickname;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  NicknameText: {
    fontSize: 30,
    marginTop: "40%",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    margin: 10,
    width: "80%",
    alignSelf: "center",
  },
  logo2: {
    width: 400,
    height: 400,
    alignSelf: "center",
  },
  PreBottom: {
    backgroundColor: "#FFEDAE",
    padding: 10,
    marginTop: "10%",
    width: "30%",
    alignSelf: "center",
    borderRadius: 10,
  },

  NextBottom: {
    backgroundColor: "#FFEDAE",
    padding: 10,
    marginTop: "10%",
    width: "30%",
    alignSelf: "center",
    borderRadius: 10,
  },
  BottomText: {
    fontSize: 15,
    color: "black",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: "20%",
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 5,
  },
});
