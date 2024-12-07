import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomNavigation from "../components/BottomNavigation";

const PointShopScreen = ({ navigation, route }) => {
  const [userPoints, setUserPoints] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const loadUserPoints = async () => {
      try {
        const points = await AsyncStorage.getItem("userPoints");
        setUserPoints(points ? Number(points) : 0);
      } catch (error) {
        console.error("포인트 로딩 에러:", error);
      }
    };

    const fetchItems = async () => {
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (!token) {
          Alert.alert("오류", "로그인이 필요합니다.");
          navigation.navigate("Login");
          return;
        }

        const response = await fetch("http://3.34.96.14:8080/api/products", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          switch (response.status) {
            case 401:
              Alert.alert(
                "인증 오류",
                "로그인이 만료되었습니다. 다시 로그인해주세요."
              );
              navigation.navigate("Login");
              return;
            case 403:
              Alert.alert("권한 오류", "접근 권한이 없습니다.");
              return;
            case 404:
              Alert.alert("오류", "요청한 리소스를 찾을 수 없습니다.");
              return;
            case 500:
              Alert.alert(
                "서버 오류",
                "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
              );
              return;
            default:
              Alert.alert("오류", "알 수 없는 오류가 발생했습니다.");
              return;
          }
        }

        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error("상품 목록 로딩 에러:", error);
        Alert.alert("오류", "상품 목록을 불러오는데 실패했습니다.");
      }
    };

    loadUserPoints();
    fetchItems();
  }, [navigation]);

  const filteredItems = useMemo(() => {
    if (!searchText) return items;

    const lowercaseSearch = searchText.toLowerCase();
    return items.filter((item) =>
      item.name.toLowerCase().includes(lowercaseSearch)
    );
  }, [searchText, items]);

  const handleExchange = async (productId, requiredPoints, title) => {
    if (userPoints < requiredPoints) {
      Alert.alert("포인트 부족", "포인트가 부족합니다.");
      return;
    }

    Alert.alert("", `${requiredPoints}포인트를\n ${title}으로\n 교환합니다.`, [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "확인",
        onPress: async () => {
          try {
            // JWT 토큰 가져오기
            const token = await AsyncStorage.getItem("jwtToken");
            if (!token) {
              Alert.alert("오류", "로그인이 필요합니다.");
              navigation.navigate("Login");
              return;
            }

            // 쿠폰 구매 API 호출
            const response = await fetch(
              `http://3.34.96.14:8080/api/coupons/purchase/${productId}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (!response.ok) {
              switch (response.status) {
                case 401:
                  Alert.alert(
                    "인증 오류",
                    "로그인이 만료되었습니다. 다시 로그인해주세요."
                  );
                  navigation.navigate("Login");
                  return;
                case 403:
                  Alert.alert("권한 오류", "접근 권한이 없습니다.");
                  return;
                case 404:
                  Alert.alert("오류", "상품을 찾을 수 없습니다.");
                  return;
                case 500:
                  Alert.alert(
                    "서버 오류",
                    "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
                  );
                  return;
                default:
                  Alert.alert("오류", "알 수 없는 오류가 발생했습니다.");
                  return;
              }
            }

            const newCoupon = await response.json();

            // 포인트 차감
            const newPoints = userPoints - requiredPoints;
            setUserPoints(newPoints);
            await AsyncStorage.setItem("userPoints", newPoints.toString());

            Alert.alert("교환 성공!", "쿠폰함으로 이동하시겠습니까?", [
              {
                text: "확인",
                onPress: () => navigation.navigate("CouponWallet"),
              },
              {
                text: "취소",
                style: "cancel",
              },
            ]);
          } catch (error) {
            console.error("쿠폰 구매 오류:", error);
            Alert.alert("오류", "쿠폰 구매 중 오류가 발생했습니다.");
          }
        },
      },
    ]);
  };

  const PointItem = ({ id, title, points }) => (
    <TouchableOpacity
      style={styles.pointItemContainer}
      onPress={() => handleExchange(id, points, title)}
    >
      <View style={styles.pointItemBox}>
        <Text style={styles.itemTitle}>{title}</Text>
      </View>
      <Text style={styles.pointText}>{points} 포인트</Text>
    </TouchableOpacity>
  );

  const EmptyResult = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>포인트 상점</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>
      <View style={styles.divider} />

      <ScrollView style={styles.content}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <PointItem
              key={item.id}
              id={item.id}
              title={item.name}
              points={item.pointCost}
            />
          ))
        ) : (
          <EmptyResult />
        )}
      </ScrollView>
      <BottomNavigation navigation={navigation} currentRoute={route.name} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 8,
    width: "70%",
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  pointBalance: {
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  balanceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2196F3",
  },
  content: {
    flex: 1,
    paddingVertical: 8,
  },
  pointItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginHorizontal: 16,
    marginVertical: 18,
  },
  pointItemBox: {
    width: "50%",
    height: 60,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginLeft: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 16,
    textAlign: "center",
  },
  pointText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2196F3",
    width: "40%",
    textAlign: "left",
    paddingRight: 8,
    marginLeft: 32,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  divider: {
    width: "80%",
    height: 1,
    backgroundColor: "black",
    alignSelf: "center",
    marginBottom: 8,
    marginTop: 16,
  },
});

export default PointShopScreen;
