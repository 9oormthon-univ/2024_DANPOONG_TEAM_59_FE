import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AssistDetail = ({ route, navigation }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isPostModalVisible, setIsPostModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssistDetail();
  }, [postId]);

  const loadAssistDetail = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");

      if (!jwtToken) {
        Alert.alert("인증 오류", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      const response = await fetch(
        `http://3.34.96.14:8080/api/support-info/${postId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response body:", responseText);

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert("인증 만료", "다시 로그인해주세요.");
          navigation.navigate("KakaoLogin");
          return;
        }
        if (response.status === 404) {
          Alert.alert("알림", "존재하지 않는 게시글입니다.");
          navigation.goBack();
          return;
        }
        throw new Error(`서버 응답 오류: ${response.status} - ${responseText}`);
      }

      const data = responseText ? JSON.parse(responseText) : null;
      if (!data) {
        throw new Error("서버로부터 데이터를 받지 못했습니다.");
      }

      console.log("Parsed data:", data);
      setPost(data);
    } catch (error) {
      console.error("게시글 상세 정보 로딩 에러:", error);
      console.error("Error details:", error.message);
      Alert.alert(
        "오류",
        `게시글을 불러오는데 실패했습니다.\n${error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userNickname = await AsyncStorage.getItem("userNickname");
        setCurrentUser(userNickname);
      } catch (error) {
        console.error("사용자 정보 로딩 에러:", error);
      }
    };

    loadUserInfo();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      }) +
      " " +
      date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFEDAE" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text>게시글을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.postContainer}>
        <TouchableOpacity
          style={styles.postContentWrapper}
          onPress={() => setIsPostModalVisible(true)}
        >
          <ScrollView style={styles.postScrollView}>
            <View style={styles.tagContainer}>
              <View style={styles.tagWrapper}>
                <Text style={styles.tag}>{post.tags[0]}</Text>
              </View>
            </View>
            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.content}>{post.content}</Text>
          </ScrollView>
          <View style={styles.authorContainer}>
            <View style={styles.authorDateContainer}>
              <Text style={styles.author}>작성자: {post.department}</Text>
              <Text style={styles.authorDateDivider}>|</Text>
              <Text style={styles.date}>
                {post.updatedAt ? formatDate(post.updatedAt) : "날짜 없음"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.commentsContainer}>
        <FlatList
          data={comments}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.commentContainer}>
              <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentText}>{item.text}</Text>
                  {item.author === currentUser && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteComment(index)}
                    >
                      <Text style={styles.deleteButtonText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.commentInfo}>
                  <Text style={styles.commentAuthor}>{item.author}</Text>
                  <Text style={styles.commentDivider}>|</Text>
                  <Text style={styles.commentDate}>{item.date}</Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>

      <Modal
        visible={isPostModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPostModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.tagContainer}>
                <View style={styles.tagWrapper}>
                  <Text style={styles.tag}>{post.tags[0]}</Text>
                </View>
              </View>
              <Text style={styles.title}>{post.title}</Text>
              <Text style={styles.content}>{post.content}</Text>
              <View style={styles.authorDateContainer}>
                <Text style={styles.author}>작성자: {post.department}</Text>
                <Text style={styles.authorDateDivider}>|</Text>
                <Text style={styles.date}>
                  {post.updatedAt ? formatDate(post.updatedAt) : "날짜 없음"}
                </Text>
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsPostModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  postContainer: {
    height: "40%",
    borderBottomWidth: 0,
    borderBottomColor: "#eee",
  },
  postContentWrapper: {
    flex: 1,
    position: "relative",
  },
  postScrollView: {
    padding: 16,
    marginBottom: 40,
  },
  tagContainer: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
  },
  tagWrapper: {
    borderRadius: 20,
    overflow: "hidden",
  },
  tag: {
    backgroundColor: "#FE9F40",
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    color: "#FFFFFF",
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  authorContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: "#fff",
  },
  authorDateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  author: {
    fontSize: 14,
    color: "#666",
  },
  authorDateDivider: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 8,
  },
  date: {
    fontSize: 14,
    color: "#888",
  },
  commentContainer: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f5f5f5",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentText: {
    fontSize: 15,
    flex: 1,
    marginBottom: 4,
  },
  deleteButton: {
    backgroundColor: "#ff3b30",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  noComments: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 16,
  },
  commentInput: {
    borderColor: "#FFEDAE",
    borderRadius: 10,
    borderWidth: 2,
    paddingRight: 300,
    paddingBottom: 20,
    marginBottom: 1,
  },
  submitButton: {
    backgroundColor: "#FFEDAE",
    borderRadius: 10,
    padding: 10,
  },
  submitButtonText: {
    color: "black",
  },
  commentAuthor: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    textAlign: "left",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 16,
    width: "100%",
  },
  commentsContainer: {
    marginTop: 20,
  },
  inputContainer: {
    borderTopWidth: 0,
    padding: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // 하단에 고정
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: 20,
  },
  commentInput: {
    flex: 1,
    borderColor: "#FFEDAE",
    borderRadius: 10,
    borderWidth: 2,
    padding: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  submitButton: {
    backgroundColor: "#FFEDAE",
    borderRadius: 10,
    padding: 10,
    width: 60,
    alignItems: "center",
  },
  submitButtonText: {
    color: "black",
  },
  commentInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  commentAuthor: {
    fontSize: 12,
    color: "#666",
  },
  commentDivider: {
    fontSize: 12,
    color: "#666",
    marginHorizontal: 8,
  },
  commentDate: {
    fontSize: 12,
    color: "#888",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalScrollView: {
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#ff3b30",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

export default AssistDetail;
