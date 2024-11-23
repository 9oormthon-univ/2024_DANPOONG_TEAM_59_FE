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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const ChatHeader = ({ userName, temperature }) => {
  const navigation = useNavigation();

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
        <View style={styles.temperatureContainer}>
          <Text style={styles.temperatureText}>{temperature}°C</Text>
        </View>
      </View>
    </View>
  );
};

const ChatNew = ({ route }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const scrollViewRef = useRef();
  const userName = route.params?.userName || "김토끼";
  const temperature = route.params?.temperature || 36.5;

  useEffect(() => {
    const initialMessages = [
      {
        _id: "1",
        text: "안녕하세요",
        createdAt: new Date(Date.now() - 1000 * 60 * 4),
        user: {
          _id: 2,
          name: userName,
          avatar: "https://via.placeholder.com/40",
        },
      },
      {
        _id: "2",
        text: "반가워요",
        createdAt: new Date(Date.now() - 1000 * 60 * 3),
        user: {
          _id: 1,
          name: "Me",
        },
      },
      {
        _id: "3",
        text: "과자를 받고싶어요",
        createdAt: new Date(Date.now() - 1000 * 60 * 2),
        user: {
          _id: 2,
          name: userName,
          avatar: "https://via.placeholder.com/40",
        },
      },
    ];
    setMessages(initialMessages);
  }, [userName]);

  const onSend = useCallback((messageText) => {
    if (messageText.trim()) {
      const newMessage = {
        _id: Math.random().toString(),
        text: messageText.trim(),
        createdAt: new Date(),
        user: {
          _id: 1,
          name: "Me",
        },
      };
      setMessages((previousMessages) => [...previousMessages, newMessage]);
      setText("");

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, []);

  const renderMessageItem = (message, index) => {
    const isMyMessage = message.user._id === 1;
    const showAvatar = !isMyMessage;

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
          <>
            {(index === 0 ||
              messages[index - 1].user._id !== message.user._id) && (
              <Text style={styles.userName}>{message.user.name}</Text>
            )}
            <View style={styles.otherMessageRow}>
              {showAvatar &&
                (index === 0 ||
                  messages[index - 1].user._id !== message.user._id) && (
                  <Image
                    source={{ uri: message.user.avatar }}
                    style={styles.avatar}
                  />
                )}
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
          </>
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

  return (
    <SafeAreaView style={styles.container}>
      <ChatHeader userName={userName} temperature={temperature} />
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
          <View style={styles.textInputContainer}>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={24} color="#000" />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="메시지를 입력하세요..."
              value={text}
              onChangeText={setText}
              multiline
              onSubmitEditing={() => onSend(text)}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => onSend(text)}
            >
              <Ionicons name="arrow-up" size={24} color="#000" />
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
    backgroundColor: "#FAF9F1",
  },
  header: {
    height: 56,
    backgroundColor: "#FAF9F1",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5EA",
    paddingHorizontal: 16,
    justifyContent: "center",
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
  temperatureContainer: {
    backgroundColor: "#FFE5E5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  temperatureText: {
    fontSize: 13,
    color: "#FF6B6B",
    fontWeight: "500",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
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
  userName: {
    fontSize: 12,
    color: "#000000",
    marginLeft: 56,
    marginBottom: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
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
  },
  textInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 6,
    maxHeight: 100,
    paddingHorizontal: 8,
  },
  addButton: {
    padding: 8,
  },
  sendButton: {
    padding: 8,
  },
});

export default ChatNew;
