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

const ChildCareDetail = ({ route, navigation }) => {
  const { carePostId } = route.params;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [authorProfileImage, setAuthorProfileImage] = useState(
    "https://via.placeholder.com/50"
  );
  const [locationInfo, setLocationInfo] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [sharingStatuses, setSharingStatuses] = useState([
    { value: "구인완료", label: "구인완료" },
    { value: "예약중", label: "예약중" },
  ]);

  useEffect(() => {
    console.log("ChildCareDetail mounted with carePostId:", carePostId);
    loadPostDetail();
    getUserInfo();
    loadLocationInfo();
  }, [carePostId]);

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

  const loadLocationInfo = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem("userLocation");
      if (savedLocation) {
        const locationData = JSON.parse(savedLocation);
        setLocationInfo(locationData);
      }
    } catch (error) {
      console.error("위치 정보 로딩 에러:", error);
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

  // 시간 포맷팅 함수 수정
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  };

  // 게시글 상세 정보 로딩 부분 수정
  const loadPostDetail = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      const response = await fetch(
        `http://3.34.96.14:8080/api/carePosts/${carePostId}`,
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
          Alert.alert("알림", "로그인이 만료되었습니다. 다시 로그인해주세요.");
          navigation.navigate("KakaoLogin");
          return;
        }
        throw new Error("게시글 조회에 실패했습니다.");
      }

      const data = await response.json();
      setPost(data);
      setComments(data.commentResponse || []);
      setAuthorProfileImage(
        data.profileImageUrl || "https://via.placeholder.com/50"
      );
      setLoading(false);
    } catch (error) {
      console.error("게시글 상세 정보 로딩 에러:", error);
      Alert.alert("오류", "게시글을 �� 실패했습니다.");
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
        `http://3.34.96.14:8080/api/carePosts/${carePostId}/comments`,
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
        if (response.status === 401) {
          Alert.alert("알림", "로그인이 만료되었습니다. 다시 로그인해주세요.");
          navigation.navigate("KakaoLogin");
          return;
        }
        throw new Error("댓글 등록에 실패했습니다.");
      }

      setNewComment("");
      await loadPostDetail();
      Alert.alert("성공", "댓글이 었습니다.");
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
        navigation.navigate("KakaoLogin");
        return;
      }

      Alert.alert("댓글 삭제", "정말로 이 댓글을 삭제하시겠습니까?", [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `http://3.34.96.14:8080/api/carePosts/${carePostId}/comments/${commentId}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${jwtToken}`,
                  },
                }
              );

              if (!response.ok) {
                if (response.status === 401) {
                  Alert.alert(
                    "알림",
                    "로그인이 만료되었습니다. 다시 로그인해주세요."
                  );
                  navigation.navigate("KakaoLogin");
                  return;
                }
                throw new Error("댓글 삭제에 실패했습니다.");
              }

              await loadPostDetail();
              Alert.alert("성공", "댓글이 삭제되었습니다.");
            } catch (error) {
              console.error("댓글 삭제 에러:", error);
              Alert.alert("오류", "댓글 삭제에 실패했습니다.");
            }
          },
        },
      ]);
    } catch (error) {
      console.error("댓글 삭제 에러:", error);
      Alert.alert("오류", "댓글 삭제에 실패했습니다.");
    }
  };

  const handleCommentOptions = (comment) => {
    const buttons = [
      {
        text: "삭제하기",
        onPress: () => handleDeleteComment(comment.careCommentId),
        style: "destructive",
      },
      {
        text: "쪽지 보내기",
        onPress: () => handleSendMessage(comment),
      },
      {
        text: "신고하기",
        onPress: () => handleReportComment(comment),
      },
      {
        text: "취소",
        style: "cancel",
      },
    ];

    Alert.alert("댓글 관리", "선택해주세요", buttons, { cancelable: true });
  };

  const handleSendMessage = async (comment) => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      // API 요청 데이터 로깅
      console.log("Sending request with data:", {
        tag: "돌봄",
        id: parseInt(carePostId),
      });

      const response = await fetch("http://3.34.96.14:8080/api/chatrooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          tag: "돌봄",
          id: parseInt(carePostId),
        }),
      });

      // 응답 상태 및 데이터 로깅
      console.log("Response Status:", response.status);
      const responseText = await response.text();
      console.log("Response Text:", responseText);

      if (!response.ok) {
        if (response.status === 500) {
          console.error("서버 에러 응답:", responseText);
          try {
            const errorData = JSON.parse(responseText);
            console.error("상세 에러 정보:", errorData);
            throw new Error(
              errorData.message || "서버 내부 오류가 발생했습니다."
            );
          } catch (e) {
            throw new Error("서버 내부 오류가 발생했습니다.");
          }
        }

        let errorMessage = "채팅방 생성에 실패했습니다.";
        switch (response.status) {
          case 400:
            errorMessage = "잘못된 요청입니다. 입력값을 확인해주세요.";
            break;
          case 401:
            errorMessage = "로그인이 만료되었습니다. 다시 로그인해주세요.";
            navigation.navigate("KakaoLogin");
            break;
          case 403:
            errorMessage = "권한이 없습니다.";
            break;
          case 404:
            errorMessage = "게시글을 찾을 수 없습니다.";
            break;
          case 409:
            // 이미 존재하는 채팅방 처리
            try {
              const data = JSON.parse(responseText);
              if (data.chatRoomId) {
                navigation.navigate("ChatNew", {
                  chatId: data.chatRoomId,
                  userName: comment.nickname,
                  postInfo: {
                    title: post.title,
                    thumbnail:
                      post.imageUrls?.[0] || "https://via.placeholder.com/50",
                    tags: [post.tag],
                    date: post.createdAt,
                  },
                });
                return;
              }
            } catch (e) {
              console.error("채팅방 ID 파싱 실패:", e);
            }
            errorMessage = "이미 존재하는 채팅방입니다.";
            break;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("JSON 파싱 에러:", e);
        throw new Error("서버 응답을 처리하는데 실패했습니다.");
      }

      if (!data.chatRoomId) {
        throw new Error("채팅방 ID를 받지 못했습니다.");
      }

      // 채팅방으 이동
      navigation.navigate("ChatNew", {
        chatId: data.chatRoomId,
        userName: comment.nickname,
        postInfo: {
          title: post.title,
          thumbnail: post.imageUrls?.[0] || "https://via.placeholder.com/50",
          tags: [post.tag],
          date: post.createdAt,
        },
      });
    } catch (error) {
      console.error("채팅방 생성 에러:", error);
      Alert.alert("오류", error.message || "채팅방을 생성하는데 실패했습니다.");
    }
  };

  const handleReportComment = async (comment) => {
    try {
      const reportedComments = await AsyncStorage.getItem("reportedComments");
      const reportedCommentsArray = reportedComments
        ? JSON.parse(reportedComments)
        : [];

      if (
        reportedCommentsArray.some(
          (report) =>
            report.commentId === comment.careCommentId &&
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
          onPress: () => submitCommentReport(comment, "아동 청소년 대상 성범"),
        },
        {
          text: "불 품 및 서비스",
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
          onPress: () => submitCommentReport(comment, "비정상적인 서비스 이용"),
        },
        {
          text: "기타",
          onPress: () => {
            Alert.prompt(
              "기타 신고 사유",
              "구체적인 신고 사유를 입력해주세요",
              [
                { text: "취소", style: "cancel" },
                {
                  text: "고",
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
        { text: "", style: "cancel" },
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
        commentId: comment.careCommentId,
        postId: carePostId,
        reporterId: userInfo.id,
        reportedAt: new Date().toISOString(),
        commentAuthor: comment.nickname,
        reportReason: reason,
        customReason: customReason,
        status: "pending",
      };

      reportedCommentsArray.push(newReport);
      await AsyncStorage.setItem(
        "reportedComments",
        JSON.stringify(reportedCommentsArray)
      );
      Alert.alert("료", "댓글 신고가 접수되었습니다.");
    } catch (error) {
      console.error("글 신고 저장 오류:", error);
      Alert.alert("오류", "신고 처리 중 문제가 발생했습니다.");
    }
  };

  // 댓글 렌 부분 수정
  const renderComments = () => (
    <View style={styles.commentsSection}>
      <Text style={styles.commentHeader}>댓글 {comments.length}개</Text>
      {comments.map((comment) => (
        <View key={comment.careCommentId} style={styles.commentItem}>
          <View style={styles.commentHeader}>
            <View style={styles.commentAuthorContainer}>
              <Image
                source={{
                  uri: comment.imageUrl || "https://via.placeholder.com/50",
                }}
                style={styles.commentAuthorImage}
              />
              <View style={styles.commentAuthorInfo}>
                <Text style={styles.commentAuthor}>{comment.nickname}</Text>
                <Text style={styles.commentDate}>
                  {formatDate(comment.updatedAt)}
                </Text>
              </View>
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

  // 날짜 포 함수 추가
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

  // 나눔 게시글인지 확인하는 함수
  const isSharingPost = () => {
    return post?.tags?.includes("구인중");
  };

  const handleTagChange = async (newTag) => {
    try {
      const savedPosts = await AsyncStorage.getItem("carePosts");
      const posts = savedPosts ? JSON.parse(savedPosts) : [];
      const postIndex = posts.findIndex((p) => p.carePostId === carePostId);

      if (postIndex !== -1) {
        const currentTags = posts[postIndex].tags;
        const nonUrgentTags = currentTags.filter((tag) => tag !== "긴급");

        // "긴급" 태그를 제외한 나머지 태그 변경
        posts[postIndex].tags = ["긴급", ...nonUrgentTags.map(() => newTag)];
        await AsyncStorage.setItem("carePosts", JSON.stringify(posts));
        setPost({
          ...post,
          tags: ["긴급", ...nonUrgentTags.map(() => newTag)],
        });
        Alert.alert("공", "태그가 변경되었니.");
      } else {
        Alert.alert("오류", "게시글을 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("태그 변경 에러:", error);
      Alert.alert("오류", "태그 변경에 실패했습니다.");
    }
  };

  // 태그 렌더링 부분 수정
  const renderTags = () => {
    const tags = [];
    if (post.isEmergency) tags.push("긴급");
    if (post.tag) tags.push(post.tag);

    return (
      <View style={styles.tagAndTimeContainer}>
        <View style={styles.tagContainer}>
          {tags.map((tag, index) => (
            <Text
              key={index}
              style={[
                styles.tag,
                tag === "긴급" && styles.urgentPostTag,
                tag === "예약중" && styles.reservingPostTag,
                tag === "구인완료" && styles.completedPostTag,
                tag === "구인중" && styles.recruitingPostTag,
              ]}
            >
              {tag}
            </Text>
          ))}
        </View>
        <Text style={styles.postTime}>{formatDate(post.updatedAt)}</Text>
      </View>
    );
  };

  // 돌봄 시간 정보 표시 부분 수정
  const renderCareInfo = () => (
    <View style={styles.careInfoContainer}>
      <View style={styles.dateTimeContainer}>
        <Text style={styles.dateTimeLabel}>돌봄 날짜:</Text>
        <Text style={styles.dateTimeText}>
          {post.careDate || "날짜 정보 없음"}
        </Text>
      </View>
      <View style={styles.dateTimeContainer}>
        <Text style={styles.dateTimeLabel}>돌봄 시간:</Text>
        <Text style={styles.dateTimeText}>
          {post.startTime && post.endTime
            ? `${formatTime(post.startTime)} ~ ${formatTime(post.endTime)}`
            : "시간 정보 없음"}
        </Text>
      </View>
    </View>
  );

  // 게시글 관리 옵션 처리
  const handlePostOptions = async () => {
    try {
      const userInfoString = await AsyncStorage.getItem("userInfo");
      const jwtToken = await AsyncStorage.getItem("jwtToken");

      if (!userInfoString || !jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      const userInfo = JSON.parse(userInfoString);

      // 작성자만 수��/삭제 가능하도록 체크
      if (post.memberId === userInfo.id) {
        Alert.alert("게시글 관리", "선택해주세요", [
          {
            text: "수정하기",
            onPress: () => {
              navigation.navigate("EditCarePost", {
                carePostId: carePostId,
                postData: {
                  title: post.title,
                  content: post.content,
                  careDate: post.careDate,
                  startTime: post.startTime,
                  endTime: post.endTime,
                  isEmergency: post.isEmergency,
                  imageUrls: post.imageUrls,
                  carePostTag: post.carePostTag,
                },
              });
            },
          },
          // ... 다른 옵션들 ...
          {
            text: "취소",
            style: "cancel",
          },
        ]);
      } else {
        // 작성자가 아닌 경우
        Alert.alert("알림", "게시글 작성자만 수정할 수 있습니다.");
      }
    } catch (error) {
      console.error("게시글 관리 오류:", error);
      Alert.alert("오류", "작업을 수행할 수 없습니다.");
    }
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
        {renderTags()}
        <Text style={styles.title}>{post.title}</Text>

        <View style={styles.authorInfo}>
          <View style={styles.authorDateContainer}>
            <Image
              source={{
                uri: post.profileImageUrl || "https://via.placeholder.com/50",
              }}
              style={styles.authorProfileImage}
            />
            <View style={styles.authorTextContainer}>
              <View style={styles.authorLocationContainer}>
                <Text style={styles.author}>{post.nickname}</Text>
                <Text style={styles.locationDot}>•</Text>
                <Text style={styles.locationText}>
                  {post.district || "위치 정보 없음"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {renderCareInfo()}
        <Text style={styles.postContent}>{post.content}</Text>

        {post.imageUrls && post.imageUrls.length > 0 && (
          <View style={styles.imageContainer}>
            <ScrollView horizontal style={styles.imageGallery}>
              {post.imageUrls.map((imageUri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>
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
            <Text style={styles.modalTitle}>태그 변경</Text>
            {["구인중", "구인완료", "예약중"].map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.statusOption}
                onPress={() => {
                  handleTagChange(tag);
                  setShowStatusModal(false);
                }}
              >
                <Text style={styles.statusOptionText}>{tag}</Text>
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
      <TouchableOpacity
        style={styles.optionsButton}
        onPress={handlePostOptions}
      >
        <Icon name="more-vert" size={24} color="#000" />
      </TouchableOpacity>
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
  tagAndTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  postTime: {
    fontSize: 12,
    color: "#666",
  },
  tag: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  urgentPostTag: {
    backgroundColor: "#ffebee",
    color: "#f44336",
  },
  reservingPostTag: {
    backgroundColor: "#e8f5e9",
    color: "#4caf50",
  },
  completedPostTag: {
    backgroundColor: "#fff3e0",
    color: "#ff9800",
  },
  recruitingPostTag: {
    backgroundColor: "#e3f2fd",
    color: "#2196f3",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  authorInfo: {
    marginBottom: 20,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  authorDateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorTextContainer: {
    flex: 1,
  },
  authorLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationDot: {
    fontSize: 14,
    color: "#666",
    marginHorizontal: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#666",
  },
  author: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  authorDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
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
  optionsButton: {
    padding: 4,
  },
  careInfoContainer: {
    backgroundColor: "#fBfbfb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dateTimeLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
    width: 80,
  },
  dateTimeText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  imageContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  imageGallery: {
    flexDirection: "row",
  },
  imageWrapper: {
    marginRight: 8,
  },
  postImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  singlePostImage: {
    width: 370,
    height: 330,
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: 20,
  },
  changeStatusButton: {
    backgroundColor: "#FFEDAE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  changeStatusText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusModalContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  statusOption: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 4,
  },
  marginBottom: 4,
  statusOptionText: {
    fontSize: 14,
    color: "#333",
  },
  cancelButton: {
    backgroundColor: "#FFEDAE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default ChildCareDetail;
