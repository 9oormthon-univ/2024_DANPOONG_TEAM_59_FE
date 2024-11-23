import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

const PolicyDetail = ({ route }) => {
  const { title, content } = route.params;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.content}>{content}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  content: {
    fontSize: 14,
    lineHeight: 24,
    color: "#666",
  },
});

export default PolicyDetail;
