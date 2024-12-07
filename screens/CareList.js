import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";

const CareList = () => {
  const navigation = useNavigation();
  const [careData, setCareData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
    fetchCareData();
  }, []);

  const fetchCareData = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      console.log("Token:", token);

      if (!token) {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("Login");
        return;
      }

      const response = await fetch(
        "http://3.34.96.14:8080/api/member/takeCare",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.log("Error response:", errorData);
        throw new Error("데이터를 불러오는데 실패했습니다");
      }

      const data = await response.json();
      console.log("Response data:", data);
      setCareData(data);
    } catch (error) {
      console.error("Error details:", error);
      Alert.alert("오류", "데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };
  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("ChildCareDetail", { carePostId: item.carePostId })
      }
      style={styles.card}
    >
      <View style={styles.cardContent}>
        <View style={styles.dateContainer}>
          <Text style={styles.date}>
            {new Date(item.careDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.tagRow}>
          <View style={styles.tagContainer}>
            {item.isEmergency && (
              <View style={[styles.tag, styles.urgentTag]}>
                <Text style={styles.tagText}>긴급</Text>
              </View>
            )}
            <View style={[styles.tag, styles.statusTag]}>
              <Text style={styles.statusTagText}>{item.tag}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.userInfo}>
          <Text style={styles.userId}>{item.nickname}</Text>
          <View style={styles.statsContainer}>
            <Text style={styles.dot}>•</Text>
            <Icon name="favorite" size={16} color="#666666" />
            <Text style={styles.statsText}>{item.likeCount}</Text>
            <Text style={styles.dot}>•</Text>
            <Icon name="chat-bubble-outline" size={16} color="#666666" />
            <Text style={styles.statsText}>{item.commentCount}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>돌봄 내역</Text>
        </View>
        {loading ? (
          <ActivityIndicator size="large" color="#FFEDAE" />
        ) : (
          <FlatList
            data={careData}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.carePostId)}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={fetchCareData}
                colors={["#FFEDAE"]}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cardContent: {
    padding: 16,
  },
  dateContainer: {
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
    color: "#666666",
  },
  tagRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentTag: {
    backgroundColor: "#FFE9E9",
  },
  statusTag: {
    backgroundColor: "#F5F5F5",
  },
  tagText: {
    color: "#FF5252",
    fontSize: 12,
    fontWeight: "500",
  },
  statusTagText: {
    color: "#666666",
    fontSize: 12,
    fontWeight: "500",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userId: {
    fontSize: 13,
    color: "#000000",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  statsText: {
    fontSize: 13,
    color: "#666666",
    marginLeft: 4,
  },
  dot: {
    fontSize: 13,
    color: "#666666",
    marginHorizontal: 8,
  },
});

export default CareList;
