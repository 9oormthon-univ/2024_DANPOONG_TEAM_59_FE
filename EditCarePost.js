import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const EditCarePost = ({ route, navigation }) => {
  const { carePostId, postData } = route.params;
  const [title, setTitle] = useState(postData.title);
  const [content, setContent] = useState(postData.content);
  const [selectedTag, setSelectedTag] = useState(`#${postData.tags[0]}`);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("알림", "제목과 내용을 모두 입력해주세요.");
      return;
    }

    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");

      if (!jwtToken) {
        Alert.alert("인증 오류", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      const response = await fetch(
        `http://192.168.61.45:8080/api/carePosts/${carePostId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            tags: [selectedTag.replace("#", "")],
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert("인증 만료", "다시 로그인해주세요.");
          navigation.navigate("KakaoLogin");
          return;
        }
        throw new Error("게시글 수정에 실패했습니다");
      }

      Alert.alert("성공", "게시글이 수정되었습니다.", [
        {
          text: "확인",
          onPress: () =>
            navigation.navigate("ChildCareDetail", { postId: carePostId }),
        },
      ]);
    } catch (error) {
      console.error("게시글 수정 에러:", error);
      Alert.alert("오류", "게시글 수정에 실패했습니다.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.tagContainer}>
        {["#긴급", "#일상", "#질문"].map((tag) => (
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

      <Text style={styles.label}>제목</Text>
      <TextInput
        style={styles.titleInput}
        value={title}
        onChangeText={setTitle}
        placeholder="제목을 입력하세요"
      />

      <Text style={styles.label}>내용</Text>
      <TextInput
        style={styles.contentInput}
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
        placeholder="내용을 입력하세요"
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>수정 완료</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  titleInput: {
    height: 40,
    borderWidth: 2,
    borderColor: "#FFEDAE",
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
    marginTop: 10,
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
    marginBottom: 20,
    padding: 12,
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

export default EditCarePost;
