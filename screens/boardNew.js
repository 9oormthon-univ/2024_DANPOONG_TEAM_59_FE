import React, { useState, useEffect } from "react";
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
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

const BoardNew = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState(["#정보"]);
  const [selectedImages, setSelectedImages] = useState([]);
  const navigation = useNavigation();

  // JWT 토큰 가져오기
  const getJwtToken = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      return token;
    } catch (error) {
      console.error("토큰을 가져오는데 실패했습니다:", error);
      return null;
    }
  };

  // 컴포넌트 마운트 시 로그인 체크
  React.useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      if (!accessToken) {
        Alert.alert("알림", "로그인이 필요합니다.", [
          {
            text: "확인",
            onPress: () => navigation.navigate("KakaoLogin"),
          },
        ]);
        return;
      }
    } catch (error) {
      console.error("토큰 확인 중 오류 발생:", error);
      Alert.alert("오류", "로그인 상태를 확인할 수 없습니다.");
    }
  };

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
      const jwtToken = await getJwtToken();

      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      // 서버에 전송할 데이터 준비
      const postData = {
        title: title.trim(),
        content: content.trim(),
        imageUrls: [], // 이미지 URL 배열 - 빈 배열로 시작
        postTags: selectedTags.map((tag) => tag.replace("#", "")), // tags를 postTags로 변경
      };

      // 이미지가 있는 경우에만 imageUrls 추가
      if (selectedImages.length > 0) {
        postData.imageUrls = selectedImages.map((img) => img.uri);
      }

      console.log("전송할 데이터:", postData); // 디버깅용

      const response = await fetch("http://3.34.96.14:8080/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(postData),
      });

      console.log("Response status:", response.status); // 디버깅용
      const responseText = await response.text();
      console.log("Response body:", responseText); // 디버깅용

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert("인증 오류", "로그인이 필요합니다.");
          return;
        }
        throw new Error(`서버 응답 오류: ${response.status} - ${responseText}`);
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

  const handleSelectImage = async () => {
    if (selectedImages.length >= 10) {
      Alert.alert("알림", "이미지는 최대 10장까지 추가할 수 있습니다.");
      return;
    }

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("알림", "사진 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImages([...selectedImages, result.assets[0]]);
    }
  };

  const handleDeleteImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleTagSelect = (tag) => {
    let newSelectedTags = [...selectedTags];

    if (newSelectedTags.includes(tag)) {
      if (newSelectedTags.length > 1) {
        newSelectedTags = newSelectedTags.filter((t) => t !== tag);
      }
    } else {
      newSelectedTags.push(tag);
    }

    setSelectedTags(newSelectedTags);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView>
          <Text style={[styles.label, { color: "#E78B00" }]}>제목</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력하세요"
          />

          <Text style={[styles.label, { color: "#E78B00" }]}>
            태그 입력하기
          </Text>
          <View style={styles.tagContainer}>
            {["정보", "조언", "나눔"].map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagButton,
                  selectedTags.includes(`#${tag}`) && styles.selectedTag,
                ]}
                onPress={() => handleTagSelect(`#${tag}`)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(`#${tag}`) && styles.selectedTagText,
                  ]}
                >
                  #{tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.label, { color: "#E78B00" }]}>내용</Text>
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            placeholder="내용을 입력하세요"
            onSubmitEditing={handleKeyboardSubmit}
          />

          <Text style={[styles.label, { color: "#E78B00" }]}>사진</Text>
          <View style={styles.imageSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((image, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: image.uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleDeleteImage(index)}
                  >
                    <Text style={styles.deleteImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleSelectImage}
              >
                <Text style={styles.imageButtonText}>+</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

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
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  titleInput: {
    height: 40,
    backgroundColor: "#f7f7f7",
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
    backgroundColor: "#f7f7f7",
    marginTop: 10,
  },
  selectedTag: {
    backgroundColor: "#FFECA1",
  },
  tagText: {
    color: "#000",
  },
  selectedTagText: {
    color: "#E78B00",
    fontWeight: "bold",
  },
  contentInput: {
    height: 300,
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    marginBottom: 20,
    padding: 12,
    fontSize: 16,
    textAlignVertical: "top",
  },
  imageSection: {
    marginVertical: 16,
  },
  imageContainer: {
    marginRight: 8,
    position: "relative",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 4,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  imageButtonText: {
    fontSize: 24,
    color: "#666",
  },
  submitButton: {
    backgroundColor: "#FFECA1",
    padding: 16,
    marginBottom: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E78B00",
  },
  deleteImageText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default BoardNew;
