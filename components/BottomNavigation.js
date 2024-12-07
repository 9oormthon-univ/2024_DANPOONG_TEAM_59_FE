import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
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
        <Image
          source={require("../assets/home.png")}
          style={{
            width: 30,
            height: 30,
            tintColor: currentRoute === "board" ? "#E78B00" : "#666",
          }}
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
        <Image
          source={require("../assets/assist.png")}
          style={{
            width: 30,
            height: 30,
            tintColor: currentRoute === "assistInfo" ? "#E78B00" : "#666",
          }}
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
        <Image
          source={require("../assets/comment.png")}
          style={{
            width: 30,
            height: 30,
            tintColor: currentRoute === "ChatScreen" ? "#E78B00" : "#666",
          }}
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
        <Image
          source={require("../assets/mypage.png")}
          style={{
            width: 30,
            height: 30,
            tintColor: currentRoute === "MyPage" ? "#E78B00" : "#666",
          }}
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
