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
  Image,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";

const PostDetail = ({ route, navigation }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // 나눔 상태 옵션
  const sharingStatuses = [
    { label: "나눔중", value: "sharing" },
    { label: "예약중", value: "reserved" },
    { label: "나눔완료", value: "completed" },
  ];

  useEffect(() => {
    loadPostDetail();
    getUserInfo();
  }, [postId]);

  const getUserInfo = async () => {
    try {
      const userInfoString = await AsyncStorage.getItem("userInfo");
      if (userInfoString) {
        const parsedUserInfo = JSON.parse(userInfoString);
        setUserInfo(parsedUserInfo);
      }
    } catch (error) {
      console.error("사용자 정보 로딩 에러:", error);
    }
  };

  // 게시글 작성자 확인 함수
  const isAuthor = () => {
    if (!userInfo || !post) return false;
    return post.memberId === userInfo.id;
  };

  // 댓글 작성자 확인 함수
  const isCommentAuthor = (comment) => {
    if (!userInfo) return false;
    return comment.memberId === userInfo.id;
  };

  const loadPostDetail = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      const response = await fetch(
        `http://3.34.96.14:8080/api/posts/${postId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response body:", responseText);

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert("인증 오류", "로그인이 필요합니다.");
          return;
        }
        throw new Error(`서버 응답 오류: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);

      // 서버 응답 데이터를 상태에 설정
      setPost({
        postId: data.postId,
        memberId: data.memberId,
        nickname: data.nickname,
        profileImageUrl: data.profileImageUrl,
        title: data.title,
        content: data.content,
        images: data.imageUrls || [],
        tags: data.tags || [],
        updatedAt: data.updatedAt,
        likeCount: data.likeCount || 0,
        isLiked: data.isLike || false,
        sharingStatus: data.sharingStatus,
      });

      // 댓글 데이터 설정
      if (data.commentResponse) {
        setComments(
          data.commentResponse.map((comment) => ({
            commentId: comment.commentId,
            memberId: comment.memberId,
            nickname: comment.nickname,
            content: comment.content,
            updatedAt: comment.updatedAt,
            imageUrl: comment.imageUrl,
          }))
        );
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error("게시글 상세 정보 로딩 에러:", error);
      Alert.alert("오류", "게시글을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert("알림", "댓글 내용을 입력해주세요.");
      return;
    }

    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      const response = await fetch(
        `http://3.34.96.14:8080/api/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
            content: newComment.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("댓글 작성에 실패했습니다.");
      }

      // 댓글 작성 성공 후 게시글 상세 정보 다시 로드
      setNewComment("");
      await loadPostDetail();
      Alert.alert("성공", "댓글이 등록되었습니다.");
    } catch (error) {
      console.error("댓글 작성 에러:", error);
      Alert.alert("오류", "댓글 작성에 실패했습니다.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        return;
      }

      Alert.alert("댓글 삭제", "정말로 이 댓글을 삭제하시겠습니까?", [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            const response = await fetch(
              `http://3.34.96.14:8080/api/posts/${postId}/comments/${commentId}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${jwtToken}`,
                },
              }
            );

            if (!response.ok) {
              throw new Error("댓글 삭제에 실패했습니다.");
            }

            // 댓글 삭제 성공 후 게시글 상세 정보 다시 로드
            await loadPostDetail();
            Alert.alert("성공", "댓글이 삭제되었습니다.");
          },
        },
      ]);
    } catch (error) {
      console.error("댓글 삭제 에러:", error);
      Alert.alert("오류", "댓글 삭제에 실패했습니다.");
    }
  };

  const handleCommentOptions = (comment) => {
    const options = [];
    const buttons = [];

    // 삭제하기 버튼을 모든 사용자에게 표시
    options.push("삭제하기");
    buttons.push({
      text: "삭제하기",
      onPress: () => handleDeleteComment(comment.commentId),
      style: "destructive",
    });

    options.push("신고하기");
    buttons.push({
      text: "신고하기",
      onPress: () => handleReportComment(comment),
    });

    options.push("취소");
    buttons.push({
      text: "취소",
      style: "cancel",
    });

    Alert.alert("댓글 관리", "선택해주세요", buttons, { cancelable: true });
  };

  const handleReportComment = async (comment) => {
    try {
      const reportedComments = await AsyncStorage.getItem("reportedComments");
      const reportedCommentsArray = reportedComments
        ? JSON.parse(reportedComments)
        : [];

      // 이미 신고한 댓글인지 확인
      if (
        reportedCommentsArray.some(
          (report) =>
            report.commentId === comment.commentId &&
            report.reporterId === userInfo.id
        )
      ) {
        Alert.alert("알림", "이미 신고한 댓글입니다.");
        return;
      }

      Alert.alert("신고 사유 선택", "신고 사유를 선택해주세요", [
        {
          text: "비방/욕설",
          onPress: () => submitCommentReport(comment, "비방/욕설"),
        },
        { text: "음란", onPress: () => submitCommentReport(comment, "음란") },
        {
          text: "스팸/광고",
          onPress: () => submitCommentReport(comment, "스팸/광고"),
        },
        {
          text: "아동 청소년 대상 성범죄",
          onPress: () =>
            submitCommentReport(comment, "아동 청소년 대상 성범죄"),
        },
        {
          text: "불법 상품 및 서비스",
          onPress: () => submitCommentReport(comment, "불법 상품 및 서비스"),
        },
        {
          text: "자살/자해",
          onPress: () => submitCommentReport(comment, "자살/자해"),
        },
        {
          text: "사기/사칭",
          onPress: () => submitCommentReport(comment, "사기/사칭"),
        },
        {
          text: "비정상적인 서비스 이용",
          onPress: () => submitCommentReport(comment, "비정상적 서비스 이용"),
        },
        {
          text: "기타",
          onPress: () => {
            Alert.prompt(
              "기타  사",
              "구체적인 신고 사유를 입력해주세요",
              [
                { text: "취소", style: "cancel" },
                {
                  text: "신고",
                  onPress: (reason) => {
                    if (reason && reason.trim()) {
                      submitCommentReport(comment, "기타", reason.trim());
                    } else {
                      Alert.alert("알림", "신고 사유를 입력해주세요.");
                    }
                  },
                },
              ],
              "plain-text"
            );
          },
        },
        { text: "취소", style: "cancel" },
      ]);
    } catch (error) {
      console.error("댓글 신고 처리 오류:", error);
      Alert.alert("오류", "신고를 처리할 수 없습니다.");
    }
  };

  const submitCommentReport = async (comment, reason, customReason = "") => {
    try {
      const reportedComments = await AsyncStorage.getItem("reportedComments");
      const reportedCommentsArray = reportedComments
        ? JSON.parse(reportedComments)
        : [];

      const newReport = {
        commentId: comment.commentId,
        postId: postId,
        reporterId: userInfo.id,
        reportedAt: new Date().toISOString(),
        commentAuthor: comment.nickname,
        commentContent: comment.content,
        nickname: comment.nickname,
        reportReason: reason,
        customReason: customReason,
        status: "pending",
      };

      reportedCommentsArray.push(newReport);
      await AsyncStorage.setItem(
        "reportedComments",
        JSON.stringify(reportedCommentsArray)
      );
      Alert.alert("완료", "댓글 신고가 접수되었습니다.");
    } catch (error) {
      console.error("댓글 신고 저장 오류:", error);
      Alert.alert("오류", "신고 처리 중 문제가 발생했습니다.");
    }
  };

  const renderComments = () => (
    <View style={styles.commentsSection}>
      <View style={styles.commentDivider} />
      <Text style={styles.commentSectionTitle}>댓글 {comments.length}개</Text>
      {comments.map((comment, index) => (
        <View key={index} style={styles.commentItem}>
          <View style={styles.commentItemHeader}>
            <View style={styles.commentAuthorContainer}>
              <Text style={styles.commentAuthor}>{comment.nickname}</Text>
              <Text style={styles.commentDate}>
                {formatDate(comment.updatedAt)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleCommentOptions(comment)}
              style={styles.optionsButton}
            >
              <Icon name="more-vert" size={20} color="#666" />
            </TouchableOpacity>
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

  const handleImagePress = (index) => {
    setSelectedImageIndex(index);
    setIsImageModalVisible(true);
  };

  // 이미지 모달 닫기
  const closeImageModal = () => {
    setIsImageModalVisible(false);
    setSelectedImageIndex(null);
  };

  // 나눔 게시글인지 확인하는 함수
  const isSharingPost = () => {
    return post?.tags?.includes("나눔");
  };

  // 상태 변경 처리 함수
  const handleStatusChange = async (newStatus) => {
    try {
      const savedPosts = await AsyncStorage.getItem("posts");
      const posts = JSON.parse(savedPosts);
      const postIndex = posts.findIndex((p) => p.postId === postId);

      if (postIndex !== -1) {
        posts[postIndex].sharingStatus = newStatus;
        await AsyncStorage.setItem("posts", JSON.stringify(posts));
        setPost({ ...post, sharingStatus: newStatus });
        Alert.alert("성공", "상태가 변경되었습니다.");
      }
    } catch (error) {
      console.error("상태 변경 에러:", error);
      Alert.alert("오류", "상태 변경에 실패했습니다.");
    }
    setShowStatusModal(false);
  };

  const getTagStyle = (tag) => {
    const baseStyle = {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 8,
    };

    switch (tag) {
      case "정보":
        return {
          ...baseStyle,
          backgroundColor: "#FFECA1",
        };
      case "조언":
        return {
          ...baseStyle,
          backgroundColor: "#FFECA1",
        };
      case "나눔":
        return {
          ...baseStyle,
          backgroundColor: "#FFECA1",
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: "#FFECA1",
        };
    }
  };

  const getTagTextStyle = (tag) => {
    switch (tag) {
      case "정보":
        return { color: "#FE9F40" };
      case "조언":
        return { color: "#FE9F40" };
      case "나눔":
        return { color: "#FE9F40" };
      default:
        return { color: "#FE9F40" };
    }
  };

  // 쪽지 보내기 처리 함수 추가
  const handleSendMessage = (comment) => {
    if (!userInfo) {
      Alert.alert("알림", "로그인이 필요합니다.");
      navigation.navigate("KakaoLogin");
      return;
    }

    // 쪽지 작성 화면으로 이동
    navigation.navigate("MessageWrite", {
      receiverId: comment.memberId,
      receiverNickname: comment.nickname,
    });
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
          <View style={styles.tagDateWrapper}>
            <View style={styles.tagsWrapper}>
              {post.tags?.map((tag, index) => (
                <View key={index} style={[styles.tagWrapper, getTagStyle(tag)]}>
                  <Text style={[styles.tagText, getTagTextStyle(tag)]}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.dateText}>
              {post.updatedAt ? formatDate(post.updatedAt) : "날짜 없음"}
            </Text>
          </View>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{post.title}</Text>
          {isSharingPost() && (
            <Text style={styles.sharingStatus}>
              {post.sharingStatus === "sharing" && "나눔중"}
              {post.sharingStatus === "reserved" && "예약중"}
              {post.sharingStatus === "completed" && "나눔완료"}
            </Text>
          )}
        </View>

        <View style={styles.authorContainer}>
          <Image
            source={{
              uri:
                post.profileImageUrl || "https://default-profile-image-url.com",
            }}
            style={styles.profileImage}
          />
          <Text style={styles.author}>{post.nickname}</Text>
        </View>

        <Text style={styles.postContent}>{post.content}</Text>

        {post.images && post.images.length > 0 && (
          <>
            {post.images.length === 1 ? (
              <TouchableOpacity onPress={() => handleImagePress(0)}>
                <Image
                  source={{ uri: post.images[0] }}
                  style={styles.singlePostImage}
                />
              </TouchableOpacity>
            ) : (
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                style={styles.imageScrollView}
              >
                {post.images.map((imageUri, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleImagePress(index)}
                  >
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.postImage}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Modal
              visible={isImageModalVisible}
              transparent={true}
              onRequestClose={closeImageModal}
            >
              <TouchableOpacity
                style={styles.modalBackground}
                activeOpacity={1}
                onPress={closeImageModal}
              >
                <View style={styles.modalContainer}>
                  {selectedImageIndex !== null && (
                    <Image
                      source={{ uri: post.images[selectedImageIndex] }}
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                  )}
                </View>
              </TouchableOpacity>
            </Modal>
          </>
        )}

        {isSharingPost() && isAuthor() && (
          <View style={styles.changeStatusButtonContainer}>
            <TouchableOpacity
              style={styles.changeStatusButton}
              onPress={() => setShowStatusModal(true)}
            >
              <Text style={styles.changeStatusText}>상태 변경</Text>
            </TouchableOpacity>
          </View>
        )}

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

      {/* 상태 변경 모달 */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={styles.statusModalContainer}>
            <Text style={styles.modalTitle}>나눔 상태 변경</Text>
            {sharingStatuses.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={styles.statusOption}
                onPress={() => handleStatusChange(status.value)}
              >
                <Text style={styles.statusOptionText}>{status.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    marginBottom: 60,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 8,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8, // 간격 조정
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1, // 제목이 너무 길 경우 줄바꿈
    marginRight: 10, // 상태와의 간격
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
    justifyContent: "space-between",
  },
  authorDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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

  commentsSection: {
    marginBottom: 100,
  },
  commentSectionTitle: {
    fontSize: 14,
    color: "#E78B00",
    fontWeight: "bold",
    marginBottom: 16,
  },
  commentItem: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  commentAuthorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  commentDate: {
    fontSize: 12,
    color: "#666",
  },
  commentContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  optionsButton: {
    padding: 4,
  },
  commentInputContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
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
  scrapButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1,
  },
  imageScrollView: {
    marginVertical: 16,
  },
  postImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  singlePostImage: {
    width: 376,
    height: 330,
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "90%",
    height: "90%",
    borderRadius: 8,
  },
  sharingStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sharingStatus: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2196F3", // 파란색 텍스트
  },
  changeStatusButton: {
    backgroundColor: "#FFEDAE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeStatusText: {
    color: "#333",
    fontSize: 12,
    fontWeight: "bold",
  },
  statusModalContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  statusOption: {
    width: "100%",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  statusOptionText: {
    fontSize: 16,
    textAlign: "center",
  },
  cancelButton: {
    marginTop: 15,
    width: "100%",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
  },
  changeStatusButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  likeButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 4,
    marginVertical: 12,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  likeCount: {
    fontSize: 14,
    color: "#666",
  },
  tagDateWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  tagsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center", // 세로 중앙 정렬
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  tagWrapper: {
    borderRadius: 20,
    marginRight: 8,
    alignSelf: "flex-start",
  },
  tagText: {
    fontSize: 12,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  commentDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginBottom: 16,
  },
});

export default PostDetail;
