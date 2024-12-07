import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";

const CustomActionModal = ({ visible, onClose, options }) => {
  const [pressedIndex, setPressedIndex] = useState(null);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>게시글 관리</Text>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                option.style === "destructive" && styles.destructiveButton,
                pressedIndex === index && styles.pressedButton,
              ]}
              onPressIn={() => setPressedIndex(index)}
              onPressOut={() => setPressedIndex(null)}
              onPress={() => {
                setTimeout(() => {
                  onClose();
                  option.onPress();
                }, 100);
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  option.style === "destructive" && styles.destructiveText,
                  pressedIndex === index && styles.pressedText,
                ]}
              >
                {option.text}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[
              styles.optionButton,
              styles.cancelButton,
              pressedIndex === -1 && styles.pressedButton,
            ]}
            onPressIn={() => setPressedIndex(-1)}
            onPressOut={() => setPressedIndex(null)}
            onPress={() => {
              setTimeout(() => {
                onClose();
              }, 100);
            }}
          >
            <Text
              style={[
                styles.cancelText,
                pressedIndex === -1 && styles.pressedText,
              ]}
            >
              취소
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: Dimensions.get("window").width * 0.8,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#000",
  },
  optionButton: {
    width: "100%",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "white",
    marginBottom: 8,
  },
  optionText: {
    textAlign: "center",
    fontSize: 16,
    color: "#000",
  },
  destructiveButton: {
    backgroundColor: "white",
  },
  destructiveText: {
    color: "#ff4444",
  },
  cancelButton: {
    backgroundColor: "white",
    marginTop: 4,
  },
  cancelText: {
    color: "#666",
    textAlign: "center",
    fontSize: 16,
  },
  pressedButton: {
    backgroundColor: "#FFECA1",
  },
  pressedText: {
    color: "#FE9F40",
    fontWeight: "bold",
  },
});

export default CustomActionModal;
