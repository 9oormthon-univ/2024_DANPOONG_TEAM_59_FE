import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ChatNewScreen = ({ navigation }) => {
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");

  const handleCreateChat = async () => {
    if (!title.trim()) {
      Alert.alert("알림", "제목을 입력해주세요.");
      return;
    }
    if (!tag) {
      Alert.alert("알림", "태그를 선택해주세요.");
      return;
    }

    try {
      const newChat = {
        id: Date.now().toString(),
        title: title.trim(),
        tag,
        createdAt: new Date().toISOString(),
      };

      const existingChats = await AsyncStorage.getItem("chats");
      const chats = existingChats ? JSON.parse(existingChats) : [];

      const updatedChats = [...chats, newChat];

      await AsyncStorage.setItem("chats", JSON.stringify(updatedChats));

      Alert.alert("성공", "채팅방이 생성되었습니다.", [
        {
          text: "확인",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert("오류", "채팅방 생성에 실패했습니다.");
      console.error("채팅방 생성 오류:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>새 채팅방 만들기</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="채팅방 제목을 입력하세요"
        />

        <Text style={styles.label}>태그 선택</Text>
        <View style={styles.tagContainer}>
          {["#돌봄지원", "#돌봄받기", "#나눔받기", "#나눔하기"].map(
            (tagOption) => (
              <TouchableOpacity
                key={tagOption}
                style={[
                  styles.tagButton,
                  tag === tagOption && styles.selectedTagButton,
                ]}
                onPress={() => setTag(tagOption)}
              >
                <Text
                  style={[
                    styles.tagText,
                    tag === tagOption && styles.selectedTagText,
                  ]}
                >
                  {tagOption}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateChat}
        >
          <Text style={styles.createButtonText}>채팅방 만들기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 30,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedTagButton: {
    backgroundColor: "black",
  },
  tagText: {
    fontSize: 14,
    color: "black",
  },
  selectedTagText: {
    color: "white",
  },
  createButton: {
    backgroundColor: "#FFEDAE",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
});

export default ChatNewScreen;
