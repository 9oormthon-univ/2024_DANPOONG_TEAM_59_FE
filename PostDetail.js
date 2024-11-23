import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";

const PostDetail = ({ route, navigation }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [userNickname, setUserNickname] = useState(null);

  useEffect(() => {
    loadPostDetail();
    loadComments();
    const getUserNickname = async () => {
      const nickname = await AsyncStorage.getItem("userNickname");
      setUserNickname(nickname);
    };
    getUserNickname();
  }, [postId]);

  const loadPostDetail = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");

      if (!jwtToken) {
        Alert.alert("인증 오류", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      const response = await fetch(
        `http://192.168.61.45:8080/api/posts/${postId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert("인증 만료", "다시 로그인해주세요.");
          navigation.navigate("KakaoLogin");
          return;
        }
        throw new Error("게시글을 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setPost(data);
      setComments(data.comments || []);
    } catch (error) {
      console.error("게시글 상세 정보 로딩 에러:", error);
      Alert.alert("오류", "게시글을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");

      const response = await fetch(
        `http://192.168.61.45:8080/api/posts/${postId}/comments`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("댓글을 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error("댓글 로딩 에러:", error);
      Alert.alert("오류", "댓글을 불러오는데 실패했습니다.");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert("알림", "댓글 내용을 입력해주세요.");
      return;
    }

    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");

      const response = await fetch(
        `http://192.168.61.45:8080/api/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newComment.trim(),
            postId: postId,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert("인증 만료", "다시 로그인해주세요.");
          navigation.navigate("KakaoLogin");
          return;
        }
        throw new Error("댓글 작성에 실패했습니다.");
      }

      // 댓글 작성 성공
      setNewComment(""); // 입력 초기화
      loadComments(); // 댓글 목록 새로고침
      Alert.alert("성공", "댓글이 등록되었습니다.");
    } catch (error) {
      console.error("댓글 작성 에러:", error);
      Alert.alert("오류", "댓글 작성에 실패했습니다.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");

      Alert.alert("댓글 삭제", "정말로 이 댓글을 삭제하시겠습니까?", [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "삭제",
          onPress: async () => {
            try {
              const response = await fetch(
                `http://192.168.61.45:8080/api/posts/${postId}/comments/${commentId}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${jwtToken}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              if (!response.ok) {
                if (response.status === 401) {
                  Alert.alert("인증 만료", "다시 로그인해주세요.");
                  navigation.navigate("KakaoLogin");
                  return;
                }
                throw new Error("댓글 삭제에 실패했습니다.");
              }

              // 댓글 목록 새로고침
              loadComments();
              Alert.alert("성공", "댓글이 삭제되었습니다.");
            } catch (error) {
              console.error("댓글 삭제 에러:", error);
              Alert.alert("오류", "댓글 삭제에 실패했습니다.");
            }
          },
          style: "destructive",
        },
      ]);
    } catch (error) {
      console.error("댓글 삭제 에러:", error);
      Alert.alert("오류", "댓글 삭제에 실패했습니다.");
    }
  };

  const renderComments = () => (
    <View style={styles.commentsSection}>
      <Text style={styles.commentHeader}>댓글 {comments.length}개</Text>
      {comments.map((comment, index) => (
        <View key={index} style={styles.commentItem}>
          <View style={styles.commentHeader}>
            <View style={styles.commentAuthorContainer}>
              <Text style={styles.commentAuthor}>{comment.nickname}</Text>
              <Text style={styles.commentDate}>
                {formatDate(comment.updatedAt)}
              </Text>
            </View>
            {userNickname === comment.nickname && (
              <TouchableOpacity
                onPress={() => handleDeleteComment(comment.commentId)}
                style={styles.deleteButton}
              >
                <Icon name="delete-outline" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.commentContent}>{comment.content}</Text>
        </View>
      ))}
    </View>
  );

  // 날짜 포맷팅 함수 추가
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}.${month}.${day} ${hours}:${minutes}`;
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
      <ScrollView style={styles.content}>
        <View style={styles.tagContainer}>
          {post.tags?.map((tag, index) => (
            <Text key={index} style={styles.tag}>
              #{tag}
            </Text>
          ))}
        </View>

        <Text style={styles.title}>{post.title}</Text>

        <Text style={styles.postContent}>{post.content}</Text>

        <View style={styles.authorInfo}>
          <Text style={styles.author}>{post.nickname}</Text>
          <Text style={styles.date}>
            {post.updatedAt ? formatDate(post.updatedAt) : "날짜 없음"}
          </Text>
        </View>

        <View style={styles.divider} />

        {renderComments()}
      </ScrollView>

      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="댓글을 입력하세요"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={styles.commentSubmitButton}
          onPress={handleAddComment}
        >
          <Text style={styles.commentSubmitText}>등록</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  tag: {
    backgroundColor: "#FFEDAE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  authorInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  author: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  date: {
    fontSize: 12,
    color: "#666",
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 20,
  },
  commentsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  commentAuthorContainer: {
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  commentItem: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  commentDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  commentContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginTop: 4,
  },
  commentInputContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#FFEDAE",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  commentSubmitButton: {
    backgroundColor: "#FFEDAE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  commentSubmitText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default PostDetail;
