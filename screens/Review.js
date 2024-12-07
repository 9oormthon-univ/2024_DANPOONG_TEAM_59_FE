import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Rating, AirbnbRating } from "react-native-ratings";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Review = ({ navigation, route }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("알림", "별점을 선택해주세요.");
      return;
    }
    if (!review.trim()) {
      Alert.alert("알림", "리뷰 내용을 입력해주세요.");
      return;
    }

    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      if (!route.params.chatId || !route.params.receiverId) {
        console.error("Required data missing:", {
          chatId: route.params.chatId,
          receiverId: route.params.receiverId,
        });
        Alert.alert("오류", "필수 정보가 누락되었습니다.");
        return;
      }

      const reviewData = {
        chatRoomId: Number(route.params.chatId),
        toMemberId: Number(route.params.receiverId),
        rating: Number(rating),
        content: review.trim(),
      };

      console.log("Sending review data:", reviewData);

      const response = await fetch(`http://3.34.96.14:8080/api/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      const responseText = await response.text();
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      console.log("Full response:", responseText);

      if (!response.ok) {
        let errorMessage = "후기 등록에 실패했습니다.";
        try {
          const errorData = JSON.parse(responseText);
          console.error("Error details:", {
            status: response.status,
            statusText: response.statusText,
            errorData: errorData,
          });
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error("Error parsing response:", e);
        }

        Alert.alert("오류", `${errorMessage}\n(Status: ${response.status})`, [
          {
            text: "확인",
            onPress: () => console.log("Error alert closed"),
          },
        ]);
        return;
      }

      Alert.alert("성공", "후기가 등록되었습니다.", [
        {
          text: "확인",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("후기 등록 오류:", error);
      Alert.alert(
        "오류",
        "후기 등록 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
    }
  };

  // 돌봄 시간 포맷팅 함수
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    return `${hours}:${minutes}`;
  };

  return (
    <View style={styles.container}>
      {/* 작성자 정보 섹션 */}
      {route.params.postInfo && (
        <View style={styles.authorContainer}>
          <View style={styles.authorInfo}>
            <Image
              source={{
                uri:
                  route.params.postInfo.authorImage ||
                  "https://via.placeholder.com/40",
              }}
              style={styles.authorImage}
            />
            <View style={styles.authorTextContainer}>
              <Text style={styles.authorName}>
                {route.params.postInfo.authorName}
              </Text>
              <Text style={styles.postDate}>{route.params.postInfo.date}</Text>
            </View>
          </View>
        </View>
      )}

      {/* 게시글 정보 섹션 */}
      {route.params.postInfo && (
        <View style={styles.postInfoContainer}>
          <View style={styles.tagContainer}>
            {route.params.postInfo.tags?.map((tag, index) => (
              <Text
                key={index}
                style={[
                  styles.tag,
                  tag === "긴급" && styles.urgentTag,
                  tag === "예약중" && styles.reservingTag,
                  tag === "구인완료" && styles.completedTag,
                  tag === "구인중" && styles.recruitingTag,
                ]}
              >
                {tag}
              </Text>
            ))}
          </View>
          <Text style={styles.postTitle}>{route.params.postInfo.title}</Text>
          <View style={styles.careInfoContainer}>
            <View style={styles.careInfoRow}>
              <Text style={styles.careInfoLabel}>돌봄 날짜:</Text>
              <Text style={styles.careInfoText}>
                {route.params.postInfo.careDate}
              </Text>
            </View>
            <View style={styles.careInfoRow}>
              <Text style={styles.careInfoLabel}>돌봄 시간:</Text>
              <Text style={styles.careInfoText}>
                {route.params.postInfo.startTime &&
                route.params.postInfo.endTime
                  ? `${formatTime(
                      route.params.postInfo.startTime
                    )} ~ ${formatTime(route.params.postInfo.endTime)}`
                  : "시간 정보 없음"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 사용자 정보 섹션 */}
      <View style={styles.profileSection}>
        <View style={styles.profileContainer}>
          <Image
            source={{
              uri:
                route.params.profileImage || "https://via.placeholder.com/80",
            }}
            style={styles.profileImage}
          />
          <Text style={styles.reviewTitle}>
            {route.params.userName}님에 대한 후기를 남겨주세요!
          </Text>
        </View>
      </View>

      {/* 리뷰 작성 섹션 */}
      <View style={styles.reviewSection}>
        <View style={styles.ratingContainer}>
          <Rating
            startingValue={rating}
            onFinishRating={setRating}
            style={{ paddingVertical: 10 }}
          />
        </View>

        <View style={styles.reviewContainer}>
          <Text style={styles.label}>리뷰를 작성해주세요</Text>
          <TextInput
            style={styles.input}
            multiline
            numberOfLines={4}
            value={review}
            onChangeText={setReview}
            placeholder="상품에 대한 직한 리뷰를 남겨주세요"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>작성 완료</Text>
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
  authorContainer: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
    borderRadius: 8,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorTextContainer: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  postDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  postInfoContainer: {
    backgroundColor: "#f8f8f8",
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 0,
    borderRadius: 8,
  },
  profileSection: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#fff",
    marginTop: 20,
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  reviewSection: {
    padding: 20,
    paddingTop: 0,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  urgentTag: {
    backgroundColor: "#ffebee",
    color: "#f44336",
  },
  reservingTag: {
    backgroundColor: "#e8f5e9",
    color: "#4caf50",
  },
  completedTag: {
    backgroundColor: "#fff3e0",
    color: "#ff9800",
  },
  recruitingTag: {
    backgroundColor: "#e3f2fd",
    color: "#2196f3",
  },
  postTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  careInfoContainer: {
    gap: 8,
  },
  careInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  careInfoLabel: {
    fontSize: 14,
    fontWeight: "500",
    width: 80,
  },
  careInfoText: {
    fontSize: 14,
    color: "#666",
  },
  ratingContainer: {
    marginBottom: 20,
  },
  reviewContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    alignItems: "center",
    borderRadius: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Review;
