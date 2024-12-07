import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
} from "react-native";
import ReplyBox from "../components/ReplyBox";

const NoteBox = () => {
  const [notes, setNotes] = useState([]);
  const [noteInput, setNoteInput] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);

  const addNote = () => {
    if (noteInput.trim()) {
      setNotes([...notes, noteInput]);
      setNoteInput("");
    }
  };

  const handleReply = (reply) => {
    console.log("답장:", reply);
    setSelectedNote(null);
  };

  return (
    <View style={styles.container}>
      {selectedNote ? (
        <ReplyBox note={selectedNote} onReply={handleReply} />
      ) : (
        <>
          <Text style={styles.title}>쪽지함</Text>
          <TextInput
            style={styles.input}
            value={noteInput}
            onChangeText={setNoteInput}
            placeholder="쪽지를 입력하세요"
          />
          <Button title="추가" onPress={addNote} />
          <FlatList
            data={notes}
            renderItem={({ item }) => (
              <Text style={styles.note} onPress={() => setSelectedNote(item)}>
                {item}
              </Text>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
  },
  note: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});

export default NoteBox;
