import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomNavigation from "../components/BottomNavigation";

const CouponItem = ({
  couponId,
  productId,
  name,
  pointCost,
  barcode,
  used,
  onUse,
  onPress,
}) => (
  <TouchableOpacity style={styles.couponBox} onPress={() => onPress(couponId)}>
    <View style={styles.couponHeader}>
      <Text style={styles.couponBoxTitle}>{name}</Text>
      {used && (
        <View style={styles.usedBadge}>
          <Text style={styles.usedText}>사용완료</Text>
        </View>
      )}
    </View>
    <View style={styles.couponInfo}>
      <Text style={styles.pointText}>{pointCost} 포인트</Text>
      <Text style={styles.dateText}>바코드: {barcode}</Text>
    </View>
    {!used && (
      <TouchableOpacity
        style={styles.useButton}
        onPress={(e) => {
          e.stopPropagation();
          onUse(couponId);
        }}
      >
        <Text style={styles.useButtonText}>사용하기</Text>
      </TouchableOpacity>
    )}
  </TouchableOpacity>
);

const CouponWalletScreen = ({ navigation, route }) => {
  const [coupons, setCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (!token) {
          Alert.alert("오류", "로그인이 필요합니다.");
          navigation.navigate("Login");
          return;
        }

        const response = await fetch("http://3.34.96.14:8080/api/coupons", {
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
                "서버에 문제가 생했습니다. 잠시 후 다시 시도해주세요."
              );
              return;
            default:
              Alert.alert("오류", "알 수 없는 오류가 발생했습니다.");
              return;
          }
        }

        const data = await response.json();
        setCoupons(data);
      } catch (error) {
        console.error("쿠폰 목록 로딩 에러:", error);
        Alert.alert("오류", "쿠폰 목록을 불러오는데 실패했습니다.");
      }
    };

    fetchCoupons();
  }, [navigation]);

  const handleUseCoupon = async (couponId) => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("오류", "로그인이 필요합니다.");
        navigation.navigate("Login");
        return;
      }

      const response = await fetch(
        `http://3.34.96.14:8080/api/coupons/use/${couponId}`,
        {
          method: "PUT",
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
            Alert.alert("오류", "쿠폰을 찾을 수 없습니다.");
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

      // 쿠폰 목록 새로고침
      const updatedResponse = await fetch(
        "http://3.34.96.14:8080/api/coupons", // 엔드포인트 수정
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setCoupons(updatedData);
        Alert.alert("성공", "쿠폰이 사용되었습니다.");
      }
    } catch (error) {
      console.error("쿠폰 사용 오류:", error);
      Alert.alert("오류", "쿠폰 사용 중 오류가 발생했습니다.");
    }
  };

  const handleCouponDetail = async (couponId) => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("오류", "로그인이 필요합니다.");
        navigation.navigate("Login");
        return;
      }

      const response = await fetch(
        `http://3.34.96.14:8080/api/coupons/${couponId}`,
        {
          method: "GET",
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
            Alert.alert("오류", "쿠폰을 찾을 수 없습니다.");
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

      const couponDetail = await response.json();
      console.log("쿠폰 상세 정보:", couponDetail);
      console.log("이미지 URL 또는 데이터:", couponDetail.barcode);

      // URL이 http로 시작하는지 확인
      if (couponDetail.barcode.startsWith("http")) {
        console.log("URL 형식의 이미지입니다");
      } else if (couponDetail.barcode.startsWith("data:image")) {
        console.log("Data URI 형식의 이미지입니다");
      } else {
        console.log("Base64 형식의 이미지일 수 있습니다");
      }

      setSelectedCoupon(couponDetail);
      setModalVisible(true);
    } catch (error) {
      console.error("쿠폰 상세 정보 조회 오류:", error);
      Alert.alert("오류", "쿠폰 정보를 불러오는데 실패했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>쿠폰함</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.couponShopContainer}>
          {coupons.length > 0 ? (
            coupons.map((coupon) => (
              <CouponItem
                key={coupon.couponId}
                couponId={coupon.couponId}
                productId={coupon.productId}
                name={coupon.name}
                pointCost={coupon.pointCost}
                barcode={coupon.barcode}
                used={coupon.used}
                onUse={handleUseCoupon}
                onPress={handleCouponDetail}
              />
            ))
          ) : (
            <View style={styles.emptyCoupons}>
              <Ionicons name="ticket-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>보유한 쿠폰 없습니다</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>쿠폰 상세 정보</Text>

            {selectedCoupon && (
              <>
                <Text style={styles.modalText}>
                  상품명: {selectedCoupon.name}
                </Text>
                <Text style={styles.modalText}>
                  포인트: {selectedCoupon.pointCost}
                </Text>
                <Text style={styles.modalText}>
                  상태: {selectedCoupon.used ? "사용완료" : "미사용"}
                </Text>
                <Image
                  source={{
                    uri: "https://ifh.cc/g/ZF42NX.jpg",
                  }}
                  style={[
                    styles.modalBarcodeImage,
                    { backgroundColor: "#f5f5f5" },
                  ]}
                  resizeMode="contain"
                  onError={(error) => {
                    console.error("이미지 로딩 에러:", error.nativeEvent.error);
                    console.error("시도한 URI:", selectedCoupon.barcode);
                  }}
                />
              </>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  couponShopContainer: {
    padding: 16,
  },
  couponBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  couponBoxTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  couponHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  usedBadge: {
    backgroundColor: "#666",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  usedText: {
    color: "#fff",
    fontSize: 12,
  },
  couponInfo: {
    marginTop: 8,
  },
  pointText: {
    fontSize: 14,
    color: "#2196F3",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
  },
  useButton: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 12,
  },
  useButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyCoupons: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  modalBarcodeImage: {
    width: "100%",
    height: 200,
    marginVertical: 15,
    backgroundColor: "#f5f5f5",
  },
  closeButton: {
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: "100%",
  },
  closeButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CouponWalletScreen;
