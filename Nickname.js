import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Nickname = ({ route }) => {
  const { userData } = route.params || {};
  const [nickname, setNickname] = useState(userData?.nickname || "");
  const [error, setError] = useState("");

  const navigation = useNavigation();

  const handleNext = async () => {
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요!");
      return;
    }
    try {
      await AsyncStorage.setItem("userNickname", nickname);
      setError("");
      navigation.navigate("board");
    } catch (error) {
      console.error("닉네임 저장 오류:", error);
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
