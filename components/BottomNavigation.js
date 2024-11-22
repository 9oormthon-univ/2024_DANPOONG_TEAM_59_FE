import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const BottomNavigation = ({ navigation, currentRoute }) => {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("board")}
      >
        <Icon
          name="home"
          size={24}
          color={currentRoute === "board" ? "#000" : "#666"}
        />
        <Text style={styles.navText}>홈</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("Support")}
      >
        <Icon
          name="info"
          size={24}
          color={currentRoute === "Support" ? "#000" : "#666"}
        />
        <Text style={styles.navText}>지원정보</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("Chat")}
      >
        <Icon
          name="chat"
          size={24}
          color={currentRoute === "Chat" ? "#000" : "#666"}
        />
        <Text style={styles.navText}>채팅</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("Childcare")}
      >
        <Icon
          name="child-care"
          size={24}
          color={currentRoute === "Childcare" ? "#000" : "#666"}
        />
        <Text style={styles.navText}>자녀 돌봄</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate("MyPage")}
      >
        <Icon
          name="person"
          size={24}
          color={currentRoute === "MyPage" ? "#000" : "#666"}
        />
        <Text style={styles.navText}>마이페이지</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: "#666",
  },
});

export default BottomNavigation;
