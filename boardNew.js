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

const BoardNew = () => {
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
      // 저장된 닉네임 가져오기
      const userNickname = await AsyncStorage.getItem("userNickname");

      // 기존 게시글 가져오기
      const existingPosts = await AsyncStorage.getItem("posts");
      const posts = existingPosts ? JSON.parse(existingPosts) : [];

      // 새 게시글 추가
      const newPost = {
        id: Date.now().toString(),
        title,
        content,
        tag: selectedTag,
        author: userNickname || "익명", // 저장된 닉네임 사용
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: [],
      };

      posts.unshift(newPost);
      await AsyncStorage.setItem("posts", JSON.stringify(posts));

      Alert.alert("성공", "게시글이 등록되었습니다.");
      navigation.goBack();
    } catch (error) {
      console.error("Error adding post:", error);
      Alert.alert("오류", "게시글 등록에 실패했습니다.");
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
            {["#정보", "#조언", "#나눔"].map((tag) => (
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
    flex: 1,
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

export default BoardNew;
