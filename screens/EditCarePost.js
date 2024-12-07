import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/MaterialIcons";

// 시간 포맷 변환 유틸리티 함수들
const convertTimeFormat = (timeString) => {
  if (!timeString) return "";
  if (timeString.includes("시")) return timeString;

  const [time] = timeString.split("."); // 초 단위 제거
  const [hours, minutes] = time.split(":");
  return `${hours}시 ${minutes}분`;
};

const formatTime = (hours, minutes) => {
  return `${hours.toString().padStart(2, "0")}시 ${minutes
    .toString()
    .padStart(2, "0")}분`;
};

const EditCarePost = ({ route, navigation }) => {
  const { carePostId } = route.params;
  const [loading, setLoading] = useState(true);

  // 상태 정의
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTag, setSelectedTag] = useState("구인중");
  const [selectedDates, setSelectedDates] = useState({});
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // 게시글 데이터 로드
  const loadPostData = async () => {
    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      const response = await fetch(
        `http://3.34.96.14:8080/api/carePosts/${carePostId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("게시글 정보를 불러올 수 없습니다.");
      }

      const postData = await response.json();

      setTitle(postData.title || "");
      setContent(postData.content || "");
      setSelectedTag(postData.carePostTag || "구인중");
      setSelectedDates({
        [postData.careDate]: {
          selected: true,
          selectedColor: "#FFEDAE",
        },
      });
      setStartTime(convertTimeFormat(postData.startTime) || "");
      setEndTime(convertTimeFormat(postData.endTime) || "");
      setIsUrgent(postData.isEmergency || false);
      setSelectedImages(postData.imageUrls || []);
      setLoading(false);
    } catch (error) {
      console.error("게시글 데이터 로딩 에러:", error);
      Alert.alert("오류", "게시글 정보를 불러올 수 없습니다.");
      navigation.goBack();
    }
  };

  useEffect(() => {
    loadPostData();
  }, []);

  // 날짜 선택 핸들러
  const handleDayPress = (day) => {
    const selected = {};
    if (selectedDates[day.dateString]) {
      setSelectedDates({});
    } else {
      selected[day.dateString] = {
        selected: true,
        selectedColor: "#FFEDAE",
      };
      setSelectedDates(selected);
    }
  };

  // 시간 선택 핸들러
  const handleTimeSelect = (event, selectedTime, isStartTime) => {
    if (event.type === "set" && selectedTime) {
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      const formattedTime = formatTime(hours, minutes);

      if (isStartTime) {
        setStartTime(formattedTime);
        setShowStartTimePicker(false);
      } else {
        setEndTime(formattedTime);
        setShowEndTimePicker(false);
      }
    } else {
      setShowStartTimePicker(false);
      setShowEndTimePicker(false);
    }
  };

  // 선택된 날짜 포맷팅
  const formatSelectedDates = () => {
    return Object.keys(selectedDates).sort().join(", ");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFEDAE" />
      </View>
    );
  }

  const handleKeyboardSubmit = () => {
    if (content.trim()) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("알림", "제목과 내용을 모두 입력해주세요.");
      return;
    }

    if (Object.keys(selectedDates).length === 0) {
      Alert.alert("알림", "날짜를 선택해주세요.");
      return;
    }

    if (!startTime || !endTime) {
      Alert.alert("알림", "시작 시간과 종료 시간을 모두 선택해주세요.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      // 시간 형식 변환 함수
      const formatTimeForServer = (timeStr) => {
        if (!timeStr) return "";
        const [hours, minutes] = timeStr
          .replace("시", "")
          .replace("분", "")
          .trim()
          .split(" ");
        return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
      };

      const selectedDate = Object.keys(selectedDates)[0];

      // 태그 매핑
      const tagMapping = {
        구인중: "RECRUITING",
        구인완료: "COMPLETED",
        예약중: "RESERVING",
      };

      const postData = {
        title: title.trim(),
        content: content.trim(),
        imageUrls: selectedImages,
        carePostTag: tagMapping[selectedTag] || "RECRUITING",
        isEmergency: isUrgent,
        careDate: selectedDate,
        startTime: formatTimeForServer(startTime),
        endTime: formatTimeForServer(endTime),
      };

      console.log("서버로 전송되는 데이터:", postData); // 디버깅용

      const response = await fetch(
        `http://3.34.96.14:8080/api/carePosts/${carePostId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(postData),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("서버 응답:", errorData); // 디버깅용
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      Alert.alert("성공", "게시글이 수정되었습니다.", [
        {
          text: "확인",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("게시글 수정 에러:", error);
      Alert.alert("오류", "게시글 수정에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const renderTimePicker = () => {
    if (Platform.OS === "ios") {
      return (
        <>
          {showStartTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={(event, selectedTime) =>
                handleTimeSelect(event, selectedTime, true)
              }
            />
          )}
          {showEndTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={(event, selectedTime) =>
                handleTimeSelect(event, selectedTime, false)
              }
            />
          )}
        </>
      );
    } else {
      return (
        <>
          {showStartTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(event, selectedTime) =>
                handleTimeSelect(event, selectedTime, true)
              }
            />
          )}
          {showEndTimePicker && (
            <DateTimePicker
              value={new Date()}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(event, selectedTime) =>
                handleTimeSelect(event, selectedTime, false)
              }
            />
          )}
        </>
      );
    }
  };

  const handleSelectImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("알림", "사진 접근 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setSelectedImages((prevImages) => [...prevImages, ...newImages]);
    }
  };

  const handleDeleteImage = (index) => {
    setSelectedImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.mainContainer}>
          <ScrollView style={styles.innerContainer}>
            <View style={styles.titleContainer}>
              <View style={styles.titleInputContainer}>
                <Text style={styles.title}>제목</Text>
                <TextInput
                  style={styles.titleInput}
                  value={title}
                  onChangeText={setTitle}
                  returnKeyType="next"
                  placeholder="게시글의 제목을 입력하세요."
                />
              </View>
              <View style={styles.urgentButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.urgentButton,
                    isUrgent && styles.urgentButtonSelected,
                  ]}
                  onPress={() => setIsUrgent(!isUrgent)}
                >
                  <Text
                    style={[
                      styles.urgentButtonText,
                      isUrgent && styles.urgentButtonTextSelected,
                    ]}
                  >
                    긴급
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.title}>태그</Text>
            <View style={styles.tagContainer}>
              <TouchableOpacity
                style={[
                  styles.tagButton,
                  selectedTag === "구인중" && styles.selectedTag,
                ]}
                onPress={() => setSelectedTag("구인중")}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTag === "구인중" && styles.selectedTagText,
                  ]}
                >
                  구인중
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tagButton,
                  selectedTag === "구인완료" && styles.selectedTag,
                ]}
                onPress={() => setSelectedTag("구인완료")}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTag === "구인완료" && styles.selectedTagText,
                  ]}
                >
                  구인완료
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tagButton,
                  selectedTag === "예약중" && styles.selectedTag,
                ]}
                onPress={() => setSelectedTag("예약중")}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTag === "예약중" && styles.selectedTagText,
                  ]}
                >
                  예약중
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>날짜</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowCalendar(!showCalendar)}
            >
              <Text style={styles.dateButtonText}>
                {Object.keys(selectedDates).length > 0
                  ? formatSelectedDates()
                  : "날짜 선택해주세요"}
              </Text>
            </TouchableOpacity>

            {showCalendar && (
              <View style={styles.calendarContainer}>
                <Calendar
                  style={styles.calendar}
                  markedDates={selectedDates}
                  onDayPress={handleDayPress}
                  theme={{
                    selectedDayBackgroundColor: "#FFEDAE",
                    todayTextColor: "#000000",
                    arrowColor: "#FFEDAE",
                  }}
                />
                <TouchableOpacity
                  style={styles.closeCalendarButton}
                  onPress={() => setShowCalendar(false)}
                >
                  <Text style={styles.closeCalendarButtonText}>확인</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.title}>시간</Text>
            <View style={styles.timeContainer}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>
                  {startTime || "시작 시간"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.timeSeperator}>~</Text>

              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>
                  {endTime || "종료 시간"}
                </Text>
              </TouchableOpacity>
            </View>

            {renderTimePicker()}

            <Text style={styles.title}>내용</Text>
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              returnKeyType="done"
              onSubmitEditing={handleKeyboardSubmit}
              blurOnSubmit={true}
              enablesReturnKeyAutomatically={true}
              placeholder="게시글의 내용을 입력하세요."
            />

            <Text style={styles.title}>사진</Text>
            <View style={styles.imageSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedImages.map((uri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.deleteImageButton}
                      onPress={() => handleDeleteImage(index)}
                    >
                      <Icon name="close" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={handleSelectImage}
                >
                  <View style={styles.plusIconContainer}>
                    <Icon name="add" size={30} color="#FE9F40" />
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>작성 완료</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mainContainer: {
    flex: 1,
    padding: 16,
    marginTop: 20,
  },
  innerContainer: {
    flex: 1,
    marginBottom: 60,
  },
  title: {
    fontSize: 12,
    marginBottom: 12,
    color: "#E78B00",
    fontWeight: "bold",
  },
  titleInputContainer: {
    flex: 1,
  },
  titleInput: {
    height: 40,
    fontSize: 16,
    padding: 12,
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
  },
  tagContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#FFEDAE",
  },
  selectedTag: {
    backgroundColor: "#FEEAED",
  },
  tagText: {
    color: "#000",
  },
  selectedTagText: {
    color: "black",
    fontWeight: "bold",
  },
  contentInput: {
    height: 100,
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    padding: 12,
    color: "#000000",
  },
  submitButton: {
    backgroundColor: "#FFECA1",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E78B00",
  },
  calendar: {
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFEDAE",
    padding: 5,
  },
  dateButton: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    backgroundColor: "#f7f7f7",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#999999",
  },
  calendarContainer: {
    marginBottom: 20,
  },
  closeCalendarButton: {
    backgroundColor: "#FFEDAE",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  closeCalendarButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  timeButton: {
    padding: 12,
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    width: "45%",
  },
  timeButtonText: {
    fontSize: 16,
    color: "#999999",
  },
  timeSeperator: {
    fontSize: 16,
    marginHorizontal: 8,
  },
  urgentButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#f7f7f7",
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  urgentButtonSelected: {
    backgroundColor: "#FEEAED",
  },
  urgentButtonText: {
    color: "#000",
  },
  urgentButtonTextSelected: {
    color: "black",
    fontWeight: "bold",
  },
  imageSection: {
    marginVertical: 16,
  },
  imageContainer: {
    marginRight: 8,
    position: "relative",
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  deleteImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 4,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FE9F40",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  plusIconContainer: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 30,
    gap: 8,
  },
  urgentButtonContainer: {
    marginTop: 29,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});

export default EditCarePost;
