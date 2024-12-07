import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

const ReplyBox = ({ note, onReply }) => {
  const [replyInput, setReplyInput] = useState("");

  const sendReply = () => {
    if (replyInput.trim()) {
      onReply(replyInput);
      setReplyInput("");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.note}>원본 쪽지: {note}</Text>
      <TextInput
        style={styles.input}
        value={replyInput}
        onChangeText={setReplyInput}
        placeholder="답장을 입력하세요"
      />
      <Button title="답장 보내기" onPress={sendReply} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  note: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
  },
});

export default ReplyBox;
