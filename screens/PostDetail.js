import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PostDetail = ({ route, navigation }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const savedPosts = await AsyncStorage.getItem("posts");
        if (savedPosts) {
          const posts = JSON.parse(savedPosts);
          const selectedPost = posts.find((p) => p.id === postId);
          if (selectedPost) {
            selectedPost.date = selectedPost.date || new Date().toISOString();
            setPost(selectedPost);
            setComments(selectedPost.comments || []);
          }
        }
      } catch (error) {
        console.error("게시글 로딩 에러:", error);
      }
    };

    loadPost();
  }, [postId]);

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

  const addComment = async () => {
    if (newComment.trim()) {
      try {
        const userNickname = await AsyncStorage.getItem("userNickname");

        const now = new Date();
        const formattedDate = `${now.toLocaleDateString(
          "ko-KR"
        )} ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

        const newCommentObj = {
          text: newComment,
          author: userNickname || "익명",
          date: formattedDate,
        };

        const updatedComments = [...comments, newCommentObj];
        setComments(updatedComments);
        setNewComment("");

        // AsyncStorage에 댓글 저장
        const savedPosts = await AsyncStorage.getItem("posts");
        if (savedPosts) {
          const posts = JSON.parse(savedPosts);
          const postIndex = posts.findIndex((p) => p.id === postId);

          if (postIndex !== -1) {
            posts[postIndex].comments = updatedComments;
            await AsyncStorage.setItem("posts", JSON.stringify(posts));
          }
        }
      } catch (error) {
        console.error("댓글 추가 중 오류 발생:", error);
      }
    }
  };

  const deleteComment = async (index) => {
    const commentAuthor = comments[index].author;

    if (commentAuthor !== currentUser) {
      Alert.alert("권한 없음", "자신이 작성한 댓글만 삭제할 수 있습니다.");
      return;
    }

    Alert.alert("댓글 삭제", "정말로 이 댓글을 삭제하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          const updatedComments = comments.filter((_, i) => i !== index);
          setComments(updatedComments);

          try {
            const savedPosts = await AsyncStorage.getItem("posts");
            if (savedPosts) {
              const posts = JSON.parse(savedPosts);
              const postIndex = posts.findIndex((p) => p.id === postId);
              if (postIndex !== -1) {
                posts[postIndex].comments = updatedComments;
                await AsyncStorage.setItem("posts", JSON.stringify(posts));
              }
            }
          } catch (error) {
            console.error("댓글 삭제 에러:", error);
          }
        },
      },
    ]);
  };

  if (!post) {
    return <Text>게시글을 불러오는 중입니다...</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.postContainer}>
        <View style={styles.postContentWrapper}>
          <ScrollView style={styles.postScrollView}>
            <View style={styles.tagContainer}>
              <Text style={styles.tag}>{post.tag}</Text>
            </View>
            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.content}>{post.content}</Text>
          </ScrollView>
          <View style={styles.authorContainer}>
            <View style={styles.authorDateContainer}>
              <Text style={styles.author}>작성자: {post.author}</Text>
              <Text style={styles.authorDateDivider}>|</Text>
              <Text style={styles.date}>
                {post.date
                  ? new Date(post.date).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                    }) +
                    " " +
                    new Date(post.date).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })
                  : "날짜 없음"}
              </Text>
            </View>
          </View>
        </View>
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
          ListEmptyComponent={
            <Text style={styles.noComments}>작성된 댓글이 없습니다.</Text>
          }
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.commentInput}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="댓글을 입력하세요"
          multiline={true}
        />
        <TouchableOpacity style={styles.submitButton} onPress={addComment}>
          <Text style={styles.submitButtonText}>작성</Text>
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
    marginBottom: 12,
    marginTop: 8,
  },
  tag: {
    backgroundColor: "#FFEDAE",
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    fontSize: 14,
    color: "#333",
    alignSelf: "flex-start",
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
  commentInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
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
});

export default PostDetail;
