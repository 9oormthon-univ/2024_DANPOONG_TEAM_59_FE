import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import BottomNavigation from "../components/BottomNavigation";

const ChatScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState("전체");
  const isFocused = useIsFocused();
  const [likedPosts, setLikedPosts] = useState(new Set());
  // 검색과 태그 필터링
  const filteredPosts = posts.filter((post) => {
    const matchesTag = selectedTag === "전체" || post.tag === selectedTag;
    return matchesSearch && matchesTag;
  });

  // 게시글 렌더링
  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.postItem}
        onPress={() => {
          if (item?.id) {
            navigation.navigate("PostDetail", { postId: item.id });
          } else {
            Alert.alert("오류", "채팅방 ID가 없습니다.");
          }
        }}
      >
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.tagContainer}>
          <Text style={styles.tag}>{item.tag}</Text>
        </View>
        <View style={styles.postInfo}>
          <View style={styles.leftInfo}>
            <Text style={styles.author}>{item.author}</Text>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.interactionContainer}>
            <TouchableOpacity style={styles.interactionButton}>
              <Icon name="chat-bubble-outline" size={20} color="#666" />
              <Text style={styles.interactionText}>
                {item.comments?.length || 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>채팅</Text>
        </View>

        {/* 태그 필터 */}
        <View style={styles.tagFilterContainer}>
          {["전체", "#돌봄지원", "#돌봄받기", "#나눔받기", "#나눔하기"].map(
            (tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagButton,
                  selectedTag === tag && styles.selectedTagButton,
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
            )
          )}
        </View>

        <FlatList
          data={filteredPosts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />

        <TouchableOpacity
          style={styles.writeButton}
          onPress={() => navigation.navigate("chatNew")}
        >
          <Text style={styles.writeButtonText}>+채팅방</Text>
        </TouchableOpacity>
      </View>

      <BottomNavigation navigation={navigation} currentRoute="ChatScreen" />
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
  tagFilterContainer: {
    flexDirection: "row",
    paddingHorizontal: 5,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  tagButton: {
    width: 65,
    height: 39,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedTagButton: {
    backgroundColor: "#FFEDAE",
  },
  tagText: {
    fontSize: 15,
    color: "#666",
  },
  selectedTagText: {
    color: "#000",
    fontWeight: "bold",
  },
  postItem: {
    padding: 16,
    backgroundColor: "#F4F4F4",
    borderRadius: 10,
    marginBottom: 30,
    width: "90%",
    alignSelf: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  postInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
  },
  leftInfo: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 5,
  },
  author: {
    color: "black",
  },
  date: {
    color: "#666",
  },
  writeButton: {
    position: "absolute",
    right: 20,
    bottom: 50,
    backgroundColor: "#FFEDAE",
    padding: 16,
    borderRadius: 30,
  },
  writeButtonText: {
    color: "black",
    fontWeight: "bold",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  tag: {
    fontSize: 12,
    color: "#666",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    padding: 16,
  },
  interactionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  interactionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  interactionText: {
    fontSize: 14,
    color: "#666",
  },
});

export default ChatScreen;
