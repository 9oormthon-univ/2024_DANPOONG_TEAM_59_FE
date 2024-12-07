import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useRoute } from "@react-navigation/native";

const BottomNavigation = ({ navigation }) => {
  const route = useRoute();
  const currentRoute = route.name;

  console.log("Current Route:", currentRoute);

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={[styles.navItem]}
        onPress={() => navigation.navigate("board")}
      >
        <Icon
          name="home"
          size={24}
          color={currentRoute === "board" ? "#E78B00" : "#666"}
        />
        <Text
          style={[
            styles.navText,
            currentRoute === "board" ? { color: "#E78B00" } : { color: "#666" },
          ]}
        >
          홈
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem]}
        onPress={() => navigation.navigate("assistInfo")}
      >
        <Icon
          name="info"
          size={24}
          color={currentRoute === "assistInfo" ? "#E78B00" : "#666"}
        />
        <Text
          style={[
            styles.navText,
            currentRoute === "assistInfo"
              ? { color: "#E78B00" }
              : { color: "#666" },
          ]}
        >
          지원정보
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem]}
        onPress={() => navigation.navigate("ChatScreen")}
      >
        <Icon
          name="chat"
          size={24}
          color={currentRoute === "ChatScreen" ? "#E78B00" : "#666"}
        />
        <Text
          style={[
            styles.navText,
            currentRoute === "ChatScreen"
              ? { color: "#E78B00" }
              : { color: "#666" },
          ]}
        >
          채팅
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem]}
        onPress={() => navigation.navigate("ChildCare")}
      >
        <Image
          source={require("../assets/childcare-icon.png")}
          style={{
            width: 30,
            height: 30,
            tintColor: currentRoute === "ChildCare" ? "#E78B00" : "#666",
          }}
        />
        <Text
          style={[
            styles.navText,
            currentRoute === "ChildCare"
              ? { color: "#E78B00" }
              : { color: "#666" },
          ]}
        >
          자녀 돌봄
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem]}
        onPress={() => navigation.navigate("MyPage")}
      >
        <Icon
          name="person"
          size={24}
          color={currentRoute === "MyPage" ? "#E78B00" : "#666"}
        />
        <Text
          style={[
            styles.navText,
            currentRoute === "MyPage"
              ? { color: "#E78B00" }
              : { color: "#666" },
          ]}
        >
          마이페이지
        </Text>
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
    marginBottom: 12,
  },
  navItem: {
    alignItems: "center",
    borderTopWidth: 2,
    borderTopColor: "transparent",
    paddingTop: 5,
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: "#666",
  },
  activeNavItem: {
    borderTopColor: "red",
  },
});

export default BottomNavigation;
