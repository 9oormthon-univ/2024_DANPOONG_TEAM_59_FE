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
import Icon from "react-native-vector-icons/MaterialIcons";

const EditPost = ({ route, navigation }) => {
  const {
    postId,
    title: initialTitle,
    content: initialContent,
    postTags: initialTags,
    images: initialImages,
  } = route.params;
  const [title, setTitle] = useState(initialTitle || "");
  const [content, setContent] = useState(initialContent || "");
  const [selectedTags, setSelectedTags] = useState(initialTags || ["정보"]);
  const [images, setImages] = useState(initialImages || []);

  useEffect(() => {
    console.log("EditPost 컴포넌트 마운트");
    console.log("받은 파라미터:", route.params);
    console.log("초기화된 상태:", {
      postId,
      title,
      content,
      selectedTags,
      images,
    });
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages((prevImages) => [...prevImages, ...newImages]);
    }
  };

  const removeImage = (index) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const toggleTag = (tag) => {
    const tagWithoutHash = tag.replace("#", "");
    setSelectedTags((prevTags) => {
      if (prevTags.includes(tagWithoutHash)) {
        if (prevTags.length === 1) {
          return prevTags;
        }
        return prevTags.filter((t) => t !== tagWithoutHash);
      }
      return [...prevTags, tagWithoutHash];
    });
  };

  const handleSubmit = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      console.log("수정 요청 데이터:", {
        postId,
        title,
        content,
        imageUrls: images,
        postTags: selectedTags,
      });

      const response = await fetch(
        `http://3.34.96.14:8080/api/posts/${postId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            imageUrls: images,
            postTags: selectedTags,
          }),
        }
      );

      console.log("수정 응답 상태:", response.status);
      const responseText = await response.text();
      console.log("수정 응답 데이터:", responseText);

      if (!response.ok) {
        throw new Error(`수정 실패 (${response.status}): ${responseText}`);
      }

      Alert.alert("성공", "게시글이 수정되었습니다.", [
        {
          text: "확인",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("수정 에러:", error);
      Alert.alert("오류", `게시글 수정에 실패했습니다.\n${error.message}`);
    }
  };

  const handleKeyboardSubmit = () => {
    if (content.trim()) {
      handleSubmit();
    }
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
            returnKeyType="next"
          />

          <Text style={(styles.label, { color: "#E78B00" })}>
            태그 입력하기
          </Text>
          <View style={styles.tagContainer}>
            {["정보", "조언", "나눔"].map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagButton,
                  selectedTags.includes(tag) && styles.selectedTag,
                ]}
                onPress={() => toggleTag(`#${tag}`)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.selectedTagText,
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
              {images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Icon name="close" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickImage}
              >
                <Icon name="add-photo-alternate" size={24} color="#666" />
              </TouchableOpacity>
            </ScrollView>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>수정 완료</Text>
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
    flex: 1,
    height: 300,
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    marginBottom: 20,
    padding: 12,
    fontSize: 16,
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
});

export default EditPost;
