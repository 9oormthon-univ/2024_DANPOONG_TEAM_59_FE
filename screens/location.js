/*  
    API키 수정 필요
    info.plist에 아래 코드 추가 필요
    <key>NSLocationWhenInUseUsageDescription</key>
	<string>위치 정보가 필요합니다</string>
	<key>NSLocationAlwaysUsageDescription</key>
	<string>위치 정보가 필요합니다</string>
*/

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Alert,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import Geolocation from "react-native-geolocation-service";

const KAKAO_API_KEY = "34436ef31762ee351550257f3b3543be"; // Kakao API Key 수정 필요

const Location = () => {
  const { width, height } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState("");
  const [districts, setDistricts] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestLocationPermission = async () => {
    console.log("Location permission requested");
    setIsLoading(true);
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "위치 권한 요청",
            message: "현재 위치를 확인하기 위해 위치 권한이 필요합니다.",
            buttonNeutral: "나중에 묻기",
            buttonNegative: "거부",
            buttonPositive: "허용",
          }
        );
        console.log("Permission request result:", granted);
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          Alert.alert("권한 거부", "위치 권한이 거부되었습니다.");
        }
      } else {
        getCurrentLocation();
      }
    } catch (err) {
      console.error("Permission request error:", err);
      Alert.alert("오류", "위치 권한을 확인하는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    console.log("Getting current location...");
    Geolocation.getCurrentPosition(
      async (position) => {
        console.log("Position received:", position);
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}&input_coord=WGS84`,
            {
              method: "GET",
              headers: {
                Authorization: `KakaoAK ${KAKAO_API_KEY}`,
              },
            }
          );

          console.log("Kakao API response status:", response.status);
          const data = await response.json();
          console.log("Kakao API response:", data);

          if (data.documents && data.documents.length > 0) {
            const address = data.documents[0].address;
            const locationInfo = {
              city: address.region_1depth_name,
              district: address.region_2depth_name,
              dong: address.region_3depth_name,
            };
            console.log("Location info:", locationInfo);
            setCurrentLocation(locationInfo);
            setSearchQuery(`${locationInfo.city} ${locationInfo.district}`);
            await searchAddressByDistrict(
              locationInfo.city,
              locationInfo.district
            );
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          Alert.alert("오류", "주소를 가져오는데 실패했습니다.");
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        Alert.alert("오류", `위치를 가져오는데 실패했습니다: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const searchAddressByDistrict = async (city, district) => {
    console.log("Searching address for:", city, district);
    setIsLoading(true);
    try {
      const cleanCity = city.replace("시", "").trim();
      const cleanDistrict = district.replace("구", "").trim();

      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(
          `${cleanCity} ${cleanDistrict}구 동`
        )}&size=15`,
        {
          method: "GET",
          headers: {
            Authorization: `KakaoAK ${KAKAO_API_KEY}`,
          },
        }
      );

      console.log("Search API response status:", response.status);
      const data = await response.json();
      console.log("Search API response:", data);

      if (data.documents && data.documents.length > 0) {
        const dongSet = new Set();

        data.documents.forEach((doc) => {
          const addressName = doc.address_name;
          const dongMatch = addressName.match(
            /([가-힣]+동(?!구)|[가-힣]+동\d+가)/g
          );
          if (dongMatch) {
            dongMatch.forEach((dong) => dongSet.add(dong));
          }
        });

        const dongList = Array.from(dongSet).sort();
        console.log("Extracted dong list:", dongList);

        if (dongList.length > 0) {
          setDistricts(dongList);
        } else {
          const addressResponse = await fetch(
            `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
              `${cleanCity} ${cleanDistrict}구`
            )}&size=15`,
            {
              method: "GET",
              headers: {
                Authorization: `KakaoAK ${KAKAO_API_KEY}`,
              },
            }
          );

          const addressData = await addressResponse.json();
          console.log("Address API response:", addressData);

          const addressDongSet = new Set();
          addressData.documents.forEach((doc) => {
            if (doc.address && doc.address.region_3depth_name) {
              const dong = doc.address.region_3depth_name;
              if (dong.includes("동")) {
                addressDongSet.add(dong);
              }
            }
          });

          const addressDongList = Array.from(addressDongSet).sort();
          if (addressDongList.length > 0) {
            setDistricts(addressDongList);
          } else {
            setDistricts([]);
            Alert.alert("알림", "검색 결과가 없습니다.");
          }
        }
      } else {
        console.log("No results found");
        setDistricts([]);
        Alert.alert("알림", "검색 결과가 없습니다.");
      }
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("오류", "동 목록을 가져오는데 실패했습니다.");
      setDistricts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (text) => {
    console.log("Search text:", text);
    setSearchQuery(text);

    const patterns = [
      /([가-힣]+)시?([가-힣]+)구/,
      /([가-힣]+)\s*시?\s*([가-힣]+)\s*구/,
    ];

    let matched = false;
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const [_, city, district] = match;
        console.log("Matched city and district:", city, district);
        const formattedCity = `${city}시`;
        const formattedDistrict = `${district}구`;
        setSearchQuery(`${formattedCity} ${formattedDistrict}`);
        await searchAddressByDistrict(formattedCity, formattedDistrict);
        matched = true;
        break;
      }
    }

    if (!matched) {
      setDistricts([]);
    }
  };

  const executeSearch = () => {
    const match = searchQuery.match(/([가-힣]+시)\s*([가-힣]+구)/);
    if (match) {
      searchAddressByDistrict(match[1], match[2]);
    }
  };

  const dynamicStyles = {
    container: {
      paddingHorizontal: width * 0.04,
      paddingTop: height * 0.02,
    },
    searchBox: {
      marginTop: height * 0.02,
      marginBottom: height * 0.02,
    },
    input: {
      height: height * 0.05,
      minHeight: 40,
      maxHeight: 60,
    },
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, dynamicStyles.container]}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text>검색 중...</Text>
          </View>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>우리 동네를 검색해주세요!</Text>
        </View>

        <View style={[styles.searchBox, dynamicStyles.searchBox]}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={[styles.input, dynamicStyles.input]}
              placeholder="동네 검색"
              value={searchQuery}
              onChangeText={handleSearch}
              onSubmitEditing={executeSearch}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={executeSearch}
            >
              <Text style={styles.searchButtonText}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.currentLocationButton,
            { marginBottom: height * 0.02 },
          ]}
          onPress={requestLocationPermission}
        >
          <Text style={styles.currentLocationText}>현재 위치로 설정</Text>
        </TouchableOpacity>

        {districts.length > 0 ? (
          <View style={styles.resultContainer}>
            <Text style={styles.resultHeader}>
              검색 결과 ({districts.length}개)
            </Text>
            <FlatList
              data={districts}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.districtItem,
                    { paddingVertical: height * 0.02 },
                  ]}
                  onPress={() => {
                    const fullAddress = `${searchQuery} ${item}`;
                    console.log("Selected address:", fullAddress);
                    setSearchQuery(fullAddress);
                  }}
                >
                  <Text style={styles.districtText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => `${item}-${index}`}
            />
          </View>
        ) : (
          <View style={styles.noResultContainer}>
            <Text style={styles.noResultText}>
              {searchQuery ? "검색 결과가 없습니다." : "동네를 입력해주세요."}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  searchBox: {
    width: "100%",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchButton: {
    padding: 8,
    marginRight: 4,
  },
  searchButtonText: {
    fontSize: 20,
  },
  currentLocationButton: {
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    width: "100%",
  },
  currentLocationText: {
    textAlign: "center",
    color: "#666",
  },
  resultContainer: {
    flex: 1,
    width: "100%",
  },
  resultHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  districtItem: {
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  districtText: {
    fontSize: 15,
  },
  noResultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noResultText: {
    color: "#666",
    fontSize: 16,
  },
  titleContainer: {
    width: "100%",
    paddingVertical: 16,
    alignItems: "center",
  },
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    letterSpacing: -0.5,
  },
  searchBox: {
    width: "100%",
    marginTop: 8,
  },
});

export default Location;
