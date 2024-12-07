import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ReportList = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [commentReports, setCommentReports] = useState([]);
  const [activeTab, setActiveTab] = useState("posts"); // 'posts' or 'comments'
  const [posts, setPosts] = useState({}); // 게시글 정보를 저장할 객체
  const [comments, setComments] = useState({}); // 댓글 정보를 저장할 객체

  useEffect(() => {
    loadReports();
    loadPostsAndComments();
  }, []);

  const loadReports = async () => {
    try {
      const reportedPosts = await AsyncStorage.getItem("reportedPosts");
      if (reportedPosts) {
        setReports(JSON.parse(reportedPosts));
      }

      const reportedComments = await AsyncStorage.getItem("reportedComments");
      if (reportedComments) {
        setCommentReports(JSON.parse(reportedComments));
      }
    } catch (error) {
      console.error("신고 내역 로딩 에러:", error);
    }
  };

  const loadPostsAndComments = async () => {
    try {
      // 모든 게시글 로드
      const allPosts = await AsyncStorage.getItem("posts");
      if (allPosts) {
        const postsArray = JSON.parse(allPosts);
        const postsObj = {};
        postsArray.forEach((post) => {
          postsObj[post.postId] = post;
        });
        setPosts(postsObj);
      }

      // 모든 댓글 로드
      const allComments = await AsyncStorage.getItem("comments");
      if (allComments) {
        const commentsObj = JSON.parse(allComments);
        setComments(commentsObj);
      }
    } catch (error) {
      console.error("게시글/댓글 정보 로딩 에러:", error);
    }
  };

  const handlePostReport = (report) => {
    Alert.alert("게시글 신고 처리", "어떤 작업을 수행하시겠습니까?", [
      {
        text: "게시글 보기",
        onPress: () =>
          navigation.navigate("PostDetail", { postId: report.postId }),
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => handleDeletePostReport(report),
      },
      {
        text: "취소",
        style: "cancel",
      },
    ]);
  };

  const handleCommentReport = (report) => {
    Alert.alert("댓글 신고 처리", "어떤 작업을 수행하시겠습니까?", [
      {
        text: "댓글 보기",
        onPress: () =>
          navigation.navigate("PostDetail", {
            postId: report.postId,
            commentId: report.commentId,
          }),
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => handleDeleteCommentReport(report),
      },
      {
        text: "취소",
        style: "cancel",
      },
    ]);
  };

  const handleDeletePostReport = async (report) => {
    try {
      const updatedReports = reports.filter((r) => r.postId !== report.postId);
      await AsyncStorage.setItem(
        "reportedPosts",
        JSON.stringify(updatedReports)
      );
      setReports(updatedReports);
      Alert.alert("성공", "신고가 처리되었습니다.");
    } catch (error) {
      console.error("신고 삭제 에러:", error);
      Alert.alert("오류", "신고 처리 중 문제가 발생했습니다.");
    }
  };

  const handleDeleteCommentReport = async (report) => {
    try {
      const updatedCommentReports = commentReports.filter(
        (r) => r.commentId !== report.commentId
      );
      await AsyncStorage.setItem(
        "reportedComments",
        JSON.stringify(updatedCommentReports)
      );
      setCommentReports(updatedCommentReports);
      Alert.alert("성공", "신고가 처리되었습니다.");
    } catch (error) {
      console.error("신고 삭제 에러:", error);
      Alert.alert("오류", "신고 처리 중 문제가 발생했습니다.");
    }
  };

  const renderPostReport = ({ item }) => {
    const post = posts[item.postId] || {};

    return (
      <TouchableOpacity
        style={styles.reportItem}
        onPress={() => handlePostReport(item)}
      >
        <Text style={styles.reportType}>게시글 신고</Text>
        <Text style={styles.reportReason}>사유: {item.reportReason}</Text>
        <View style={styles.contentContainer}>
          <Text style={styles.contentTitle}>
            제목: {post.title || "삭제된 게시글"}
          </Text>
          <Text style={styles.contentText} numberOfLines={2}>
            내용: {post.content || "삭제된 게시글"}
          </Text>
          <Text style={styles.authorText}>
            작성자: {post.nickname || "알 수 없음"}
          </Text>
        </View>
        <Text style={styles.reportDate}>
          신고일: {new Date(item.reportedAt).toLocaleDateString()}
        </Text>
        {item.customReason && (
          <Text style={styles.customReason}>상세: {item.customReason}</Text>
        )}
        <Text style={styles.reportStatus}>
          상태: {item.status === "pending" ? "처리 대기" : "처리 완료"}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCommentReport = ({ item }) => {
    const post = posts[item.postId] || {};

    return (
      <TouchableOpacity
        style={styles.reportItem}
        onPress={() => handleCommentReport(item)}
      >
        <Text style={styles.reportType}>댓글 신고</Text>
        <Text style={styles.reportReason}>사유: {item.reportReason}</Text>
        <View style={styles.contentContainer}>
          <Text style={styles.contentTitle}>
            게시글: {post.title || "삭제된 게시글"}
          </Text>
          <Text style={styles.contentText} numberOfLines={2}>
            댓글 내용: {item.commentContent || "삭제된 댓글"}
          </Text>
          <Text style={styles.authorText}>
            작성자: {item.nickname || "알 수 없음"}
          </Text>
        </View>
        <Text style={styles.reportDate}>
          신고일: {new Date(item.reportedAt).toLocaleDateString()}
        </Text>
        {item.customReason && (
          <Text style={styles.customReason}>상세: {item.customReason}</Text>
        )}
        <Text style={styles.reportStatus}>
          상태: {item.status === "pending" ? "처리 대기" : "처리 완료"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "posts" && styles.activeTab]}
          onPress={() => setActiveTab("posts")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "posts" && styles.activeTabText,
            ]}
          >
            게시글 신고
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "comments" && styles.activeTab]}
          onPress={() => setActiveTab("comments")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "comments" && styles.activeTabText,
            ]}
          >
            댓글 신고
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === "posts" ? reports : commentReports}
        keyExtractor={(item, index) => index.toString()}
        renderItem={
          activeTab === "posts" ? renderPostReport : renderCommentReport
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF6B6B",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#FF6B6B",
    fontWeight: "bold",
  },
  reportItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  reportType: {
    fontSize: 14,
    color: "#FF6B6B",
    marginBottom: 5,
    fontWeight: "bold",
  },
  reportReason: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  reportDate: {
    fontSize: 13,
    color: "#888",
    marginTop: 5,
  },
  customReason: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    fontStyle: "italic",
  },
  reportStatus: {
    fontSize: 14,
    color: "#FF6B6B",
    marginTop: 5,
  },
  contentContainer: {
    backgroundColor: "#f8f8f8",
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  contentText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  authorText: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
});

export default ReportList;
