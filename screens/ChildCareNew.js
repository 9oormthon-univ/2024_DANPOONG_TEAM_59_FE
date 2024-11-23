import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

const ChildCareNew = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTag, setSelectedTag] = useState("#정보");
  const navigation = useNavigation();

  const handleKeyboardSubmit = () => {
    if (content.trim()) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("알림", "제목과 내용을 모두 입력해주세요.");
      return;
    }

    try {
      // JWT 토큰과 사용자 정보 가져오기
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      const userNickname = await AsyncStorage.getItem("userNickname");

      if (!jwtToken || !userNickname) {
        Alert.alert("인증 오류", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      const baseUrl =
        process.env.SERVER_URL || "http://192.168.61.45:8080/api/carePosts";

      const postData = {
        title: title.trim(),
        content: content.trim(),
        tags: [selectedTag],
        nickname: userNickname,
        memberId: await AsyncStorage.getItem("userId"),
      };

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
          Accept: "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert("인증 만료", "다시 로그인해주세요.");
          navigation.navigate("KakaoLogin");
          return;
        }
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      Alert.alert("성공", "게시글이 등록되었습니다.", [
        {
          text: "확인",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("게시글 등록 에러:", error);
      Alert.alert("오류", "게시글 등록에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.innerContainer}>
          <View style={styles.tagContainer}>
            {["긴급", "구인중", "구인완료", "예약중"].map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagButton,
                  selectedTag === tag && styles.selectedTag,
                ]}
                onPress={() => setSelectedTag(tag)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTag === tag && styles.selectedTagText,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.title}>제목</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />

          <Text style={styles.title}>내용</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            returnKeyType="done"
            onSubmitEditing={handleKeyboardSubmit}
            blurOnSubmit={true}
            enablesReturnKeyAutomatically={true}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>작성 완료</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 16,
    marginBottom: 8,
  },
  titleInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#FFEDAE",
    borderWidth: 2,
    marginBottom: 30,
    fontSize: 16,
    borderRadius: 8,
    padding: 12,
  },
  tagContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#FFEDAE",
  },
  selectedTag: {
    backgroundColor: "#FFEDAE",
  },
  tagText: {
    color: "#000",
  },
  selectedTagText: {
    color: "black",
    fontWeight: "bold",
  },
  contentInput: {
    height: 300,
    borderWidth: 2,
    borderColor: "#FFEDAE",
    borderRadius: 8,
    marginBottom: 200,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#FFEDAE",
    padding: 16,
    marginBottom: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChildCareNew;
