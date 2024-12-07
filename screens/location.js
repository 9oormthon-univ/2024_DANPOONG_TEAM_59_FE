import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ImageBackground,
} from "react-native";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function LocationScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [jwtToken, setJwtToken] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });

    const getJwtToken = async () => {
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        if (token) {
          setJwtToken(token);
        } else {
          Alert.alert("오류", "로그인이 필요합니다.");
          navigation.navigate("KakaoLogin");
        }
      } catch (error) {
        console.error("토큰 가져오기 실패:", error);
        Alert.alert("오류", "로그인 정보를 불러오는데 실패했습니다.");
      }
    };
    getJwtToken();
  }, []);

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 거부", "위치 권한이 필합니다.");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      let result = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      console.log("Geocoding 결과:", result[0]);

      if (result[0]) {
        const addressInfo = {
          province: result[0].region || "",
          city: result[0].city || result[0].locality || "",
          district: result[0].subregion || result[0].district || "",
        };
        console.log("변환된 주소:", addressInfo);

        if (
          !addressInfo.province ||
          !addressInfo.city ||
          !addressInfo.district
        ) {
          console.log("불완전한 주소 정보:", result[0]);
          Alert.alert("오류", "완전한 주소를 가져올 수 없습니다.");
          return;
        }

        setAddress(addressInfo);
      }
    } catch (error) {
      console.error("위치 오류:", error);
      Alert.alert("오류", "위치를 가져오는데 실패했습니다.");
    }
  };

  const handleNext = () => {
    if (!address) {
      Alert.alert("알림", "먼저 동네를 설정해주세요.");
      return;
    }
    // 다음 화면으로 이동
    navigation.navigate("NextScreen", { address });
  };

  const getKakaoMapHTML = (lat, lng) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=b78ef62f603f028234441b1a84db096f"></script>
    </head>
    <body style="margin:0; padding:0;">
        <div id="map" style="width:100vw;height:100vh;"></div>
        <script>
            setTimeout(function() {
                var container = document.getElementById('map');
                var options = {
                    center: new kakao.maps.LatLng(${lat}, ${lng}),
                    level: 3
                };
                var map = new kakao.maps.Map(container, options);
                var marker = new kakao.maps.Marker({
                    position: new kakao.maps.LatLng(${lat}, ${lng})
                });
                marker.setMap(map);
            }, 100);
        </script>
    </body>
    </html>
  `;

  const saveLocation = async () => {
    try {
      if (!jwtToken) {
        Alert.alert("오류", "로그인이 필요합니다.");
        return;
      }

      if (!address.province || !address.city || !address.district) {
        console.log("현재 주소 정보:", address);
        Alert.alert("오류", "주소 정보가 완전하지 않습니다.");
        return;
      }

      Alert.alert(
        "팝업 알림 동의 ",
        "팝업 알림 동의 하시겠습니까?",
        [
          {
            text: "거부",
            onPress: () => proceedWithLocationSave(false),
            style: "cancel",
          },
          {
            text: "허용",
            onPress: () => proceedWithLocationSave(true),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("서버 통신 에러:", error);
      Alert.alert("오류", "위치 저장에 실패했습니다.");
    }
  };

  const proceedWithLocationSave = async (notificationAgreed) => {
    try {
      const response = await fetch(
        "http://3.34.96.14:8080/api/member/neighborhood",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
            province: address.province,
            city: address.city,
            district: address.district,
            notificationAgreed: notificationAgreed,
          }),
        }
      );

      if (response.status >= 200 && response.status < 300) {
        await AsyncStorage.setItem(
          "userLocation",
          JSON.stringify({
            address: address,
            coordinates: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            notificationAgreed: notificationAgreed,
          })
        );

        Alert.alert("알림", "동네가 설정되었습니다.");
        navigation.navigate("board");
      } else {
        throw new Error(`서버 오류: ${response.status}`);
      }
    } catch (error) {
      console.error("서버 통신 에러:", error);
      Alert.alert("오류", "위치 저장에 실패했습니다.");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/background.png")}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back-ios" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>동네 설정</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={getLocation}>
          <Icon
            name="my-location"
            size={20}
            color="#FE9F40"
            style={styles.icon}
          />
          <Text style={styles.buttonText}>현재 위치로 설정하기</Text>
        </TouchableOpacity>

        {location && (
          <View style={styles.mapContainer}>
            <WebView
              style={styles.map}
              source={{
                html: getKakaoMapHTML(
                  location.coords.latitude,
                  location.coords.longitude
                ),
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={["*"]}
              mixedContentMode="compatibility"
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn("WebView error: ", nativeEvent);
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn("WebView HTTP error: ", nativeEvent);
              }}
            />
          </View>
        )}

        {address && (
          <View style={styles.addressContainer}>
            <Text style={styles.addressText}>
              {address.province} {address.city} {address.district}
            </Text>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={saveLocation}
            >
              <Text style={styles.confirmButtonText}>이 동네로 설정하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    marginTop: 50,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 98,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  button: {
    flexDirection: "row",
    backgroundColor: "#FFECA1",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FE9F40",
    fontSize: 16,
    fontWeight: "bold",
  },
  addressContainer: {
    marginTop: 20,
    padding: 15,
    borderColor: "#FFECA1",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderRadius: 8,
  },
  addressText: {
    fontSize: 16,
    marginBottom: 10,
    color: "#ACABB3",
  },
  confirmButton: {
    backgroundColor: "#FE9f40",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  mapContainer: {
    height: 300,
    marginVertical: 15,
    borderRadius: 8,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  icon: {
    marginRight: 10,
  },
});
