import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  ActionSheetIOS,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ChatHeader = ({
  userName,
  navigation,
  route,
  postInfo,
  onOptionsPress,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userName}</Text>
      </View>
      <TouchableOpacity style={styles.optionsButton} onPress={onOptionsPress}>
        <Ionicons name="ellipsis-vertical" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

const PostPreview = ({ postInfo }) => {
  if (!postInfo) return null;

  const getTagStyle = (tag) => {
    switch (tag) {
      case "긴급":
        return styles.urgentTag;
      case "예약중":
        return styles.reservingTag;
      case "구인완료":
        return styles.completedTag;
      case "구인중":
        return styles.recruitingTag;
      default:
        return styles.defaultTag;
    }
  };

  return (
    <View style={styles.postPreviewContainer}>
      <View style={styles.postPreviewContent}>
        <Image source={{ uri: postInfo.thumbnail }} style={styles.thumbnail} />
        <View style={styles.postPreviewTextContainer}>
          <View style={styles.tagsRow}>
            {postInfo.tags?.map((tag, index) => (
              <Text key={index} style={[styles.tag, getTagStyle(tag)]}>
                {tag}
              </Text>
            ))}
            <Text style={styles.postPreviewDate}>{postInfo.date}</Text>
          </View>
          <Text style={styles.postPreviewTitle} numberOfLines={1}>
            {postInfo.title}
          </Text>
        </View>
      </View>
    </View>
  );
};

const ChatNew = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const scrollViewRef = useRef();
  const chatRoomId = route.params?.chatId;
  const userName = route.params?.userName || "김토끼";
  const postInfo = route.params?.postInfo;
  const [otherMemberId, setOtherMemberId] = useState(null);
  const [transactionStatus, setTransactionStatus] = useState("진행중");

  useEffect(() => {
    if (chatRoomId) {
      loadMessages();
    }
  }, [chatRoomId]);

  const loadMessages = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      console.log("Fetching messages for chatRoomId:", chatRoomId);

      const response = await fetch(
        `http://3.34.96.14:8080/api/chatrooms/${chatRoomId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("메시지 로드 실패");
      }

      const data = await response.json();
      console.log("Received chat data:", data);

      // id를 otherMemberId로 사용
      if (data.id) {
        console.log("Setting otherMemberId:", data.id);
        setOtherMemberId(data.id);
      }

      // 메시지 설정
      const formattedMessages = data.messages.map((msg) => ({
        _id: msg.messageId.toString(),
        text: msg.content,
        createdAt: new Date(msg.createdAt),
        user: {
          _id: msg.senderNickname === userName ? 2 : 1,
          name: msg.senderNickname,
          avatar: "https://via.placeholder.com/40",
        },
        imageUrls: msg.imageUrls || [],
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error("메시지 로드 실패:", error);
      Alert.alert("오류", "메시지를 로드하는데 실패했습니다.");
    }
  };

  const onSend = useCallback(
    async (messageText) => {
      if (!messageText.trim()) return;

      try {
        const jwtToken = await AsyncStorage.getItem("jwtToken");
        if (!jwtToken) {
          Alert.alert("알림", "로그인이 필요합니다.");
          navigation.navigate("KakaoLogin");
          return;
        }

        console.log("Sending message to chatRoomId:", chatRoomId);

        // API 요청
        const response = await fetch(
          `http://3.34.96.14:8080/api/messages/${chatRoomId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${jwtToken}`,
            },
            body: JSON.stringify({
              receiverId: route.params?.receiverId,
              content: messageText.trim(),
              imageUrls: [],
            }),
          }
        );

        if (!response.ok) {
          throw new Error("메시지 전송에 실패했습니다.");
        }

        const newMessage = {
          _id: Math.random().toString(),
          text: messageText.trim(),
          createdAt: new Date(),
          user: {
            _id: 1,
            name: "Me",
          },
        };

        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        setText("");

        scrollViewRef.current?.scrollToEnd({ animated: true });
      } catch (error) {
        console.error("메시지 전송 에러:", error);
        Alert.alert("오류", "메시지 전송에 실패했습니다.");
      }
    },
    [messages, chatRoomId, navigation, route.params?.receiverId]
  );

  const renderMessageItem = (message, index) => {
    const isMyMessage = message.user._id === 1;

    return (
      <View
        key={message._id}
        style={[
          styles.messageContainer,
          isMyMessage
            ? styles.myMessageContainer
            : styles.otherMessageContainer,
        ]}
      >
        {!isMyMessage && (
          <View style={styles.otherMessageRow}>
            <View
              style={[
                styles.messageBubble,
                !isMyMessage && styles.otherMessageBubble,
              ]}
            >
              <Text>{message.text}</Text>
            </View>
            <Text style={styles.messageTime}>
              {new Date(message.createdAt).toLocaleTimeString("ko-KR", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              })}
            </Text>
          </View>
        )}
        {isMyMessage && (
          <View style={styles.myMessageRow}>
            <Text style={styles.messageTime}>
              {new Date(message.createdAt).toLocaleTimeString("ko-KR", {
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              })}
            </Text>
            <View style={[styles.messageBubble, styles.myMessageBubble]}>
              <Text>{message.text}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const handleOptionsPress = async () => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      if (!otherMemberId) {
        Alert.alert("오류", "상대방 정보를 불러올 수 없습니다.");
        return;
      }

      console.log("Navigating to Review with params:", {
        chatId: chatRoomId,
        receiverId: otherMemberId,
        userName,
        hasToken: !!jwtToken,
      });

      const reviewParams = {
        chatId: chatRoomId,
        receiverId: otherMemberId,
        userName: userName,
        profileImage: route.params?.profileImage,
        postInfo: {
          ...postInfo,
          authorName: route.params?.postInfo?.authorName || "작자",
          authorImage:
            route.params?.postInfo?.authorImage ||
            "https://via.placeholder.com/40",
          date: route.params?.postInfo?.date || new Date().toLocaleDateString(),
          careDate: route.params?.postInfo?.careDate,
          startTime: route.params?.postInfo?.startTime,
          endTime: route.params?.postInfo?.endTime,
        },
      };

      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ["후기 보내기", "거래 상태 변경", "취소"],
            cancelButtonIndex: 2,
          },
          (buttonIndex) => {
            if (buttonIndex === 0) {
              navigation.navigate("Review", reviewParams);
            } else if (buttonIndex === 1) {
              showTransactionStatusOptions();
            }
          }
        );
      } else {
        Alert.alert("옵션", "", [
          {
            text: "후기 보내기",
            onPress: () => navigation.navigate("Review", reviewParams),
          },
          {
            text: "거래 상태 변경",
            onPress: showTransactionStatusOptions,
          },
          {
            text: "취소",
            style: "cancel",
          },
        ]);
      }
    } catch (error) {
      console.error("Error in handleOptionsPress:", error);
      Alert.alert("오류", "작업을 처리하는 중 오류가 발생했습니다.");
    }
  };

  const showTransactionStatusOptions = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["예약중", "거래완료", "취소", "닫기"],
          cancelButtonIndex: 3,
        },
        async (buttonIndex) => {
          if (buttonIndex < 3) {
            const status = ["예약중", "거래완료", "취소"][buttonIndex];
            await updateTransactionStatus(status);
          }
        }
      );
    } else {
      Alert.alert("��래 상태 변경", "상태를 선택해주세요", [
        {
          text: "예약중",
          onPress: () => updateTransactionStatus("예약중"),
        },
        {
          text: "거래완료",
          onPress: () => updateTransactionStatus("거래완료"),
        },
        {
          text: "취소",
          onPress: () => updateTransactionStatus("취소"),
        },
        {
          text: "닫기",
          style: "cancel",
        },
      ]);
    }
  };

  const updateTransactionStatus = async (status) => {
    try {
      const jwtToken = await AsyncStorage.getItem("jwtToken");
      if (!jwtToken) {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      const requestData = {
        chatRoomId: chatRoomId,
        receiverId: otherMemberId,
        tradeState: status,
      };

      console.log("Request data:", requestData);

      const response = await fetch(
        `http://3.34.96.14:8080/api/chatrooms/trade-state`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify(requestData),
        }
      );

      // 응답 텍스트를 먼저 확인
      const responseText = await response.text();
      console.log("Raw server response:", responseText);

      if (!response.ok) {
        const errorMessage = responseText
          ? JSON.parse(responseText).message
          : "거래 상태 업데이트에 실패했습니다.";
        throw new Error(errorMessage);
      }

      const responseData = responseText ? JSON.parse(responseText) : {};
      console.log("Parsed server response:", responseData);

      setTransactionStatus(status);
      Alert.alert("알림", `거래 상태가 ${status}(으)로 변경되었습니다.`);

      if (status === "거래완��" && route.params?.postInfo?.id) {
        await updatePostTag(jwtToken, route.params.postInfo.id);
      }
    } catch (error) {
      console.error("거래 상태 업데이트 에러:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      Alert.alert(
        "오류",
        "거래 상태 변경에 실패했습니다. 잠시 후 다시 시도해주세요."
      );
    }
  };

  // 게시글 태그 업데이트를 위한 새로운 함수
  const updatePostTag = async (jwtToken, postId) => {
    try {
      const response = await fetch(
        `http://3.34.96.14:8080/api/carePosts/${postId}/tag`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({ tag: "구인완료" }),
        }
      );

      if (!response.ok) {
        console.error("게시글 태그 업데이트 실패");
        Alert.alert(
          "알림",
          "거래 상태는 변경되었으나, 게시글 태그 업데이트에 실패했습니다."
        );
      }
    } catch (error) {
      console.error("게시글 태그 업데이트 에러:", error);
      Alert.alert("오류", "게시글 태그 업데이트에 실패했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ChatHeader
        userName={userName}
        navigation={navigation}
        route={route}
        postInfo={postInfo}
        onOptionsPress={handleOptionsPress}
      />
      <PostPreview postInfo={postInfo} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: false })
          }
        >
          {messages.map((message, index) => renderMessageItem(message, index))}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={24} color="#666" />
          </TouchableOpacity>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="메시지를 입력하세요"
              value={text}
              onChangeText={setText}
              multiline
              onSubmitEditing={() => onSend(text)}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => onSend(text)}
            >
              <Ionicons name="arrow-up" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    height: 56,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5EA",
    paddingHorizontal: 16,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000000",
    marginRight: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollViewContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  myMessageContainer: {
    alignItems: "flex-end",
  },
  otherMessageContainer: {
    alignItems: "flex-start",
  },
  otherMessageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginLeft: 8,
  },
  myMessageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  messageBubble: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    maxWidth: "70%",
  },
  myMessageBubble: {
    backgroundColor: "#FFFFFF",
    marginLeft: 8,
  },
  otherMessageBubble: {
    marginRight: 8,
  },
  messageTime: {
    fontSize: 10,
    color: "#8E8E93",
    marginHorizontal: 4,
    alignSelf: "flex-end",
  },
  inputContainer: {
    borderTopWidth: 0.5,
    borderTopColor: "#E5E5EA",
    padding: 8,
    backgroundColor: "#f5f5f5",
    flexDirection: "row",
    alignItems: "center",
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    paddingHorizontal: 8,
  },
  sendButton: {
    padding: 8,
  },
  postPreviewContainer: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  postPreviewContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  postPreviewTextContainer: {
    flex: 1,
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  postPreviewTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  tag: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 4,
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
  defaultTag: {
    backgroundColor: "#f5f5f5",
    color: "#666666",
  },
  postPreviewDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  postPreviewText: {
    fontSize: 13,
    color: "#666666",
  },
  optionsButton: {
    padding: 8,
  },
});

export default ChatNew;
