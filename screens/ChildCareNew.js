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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/MaterialIcons";

const ChildCareNew = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTag, setSelectedTag] = useState("구인중");
  const [userInfo, setUserInfo] = useState(null);
  const [selectedDates, setSelectedDates] = useState({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    getUserInfo();
  }, []);

  const getUserInfo = async () => {
    try {
      const userInfoString = await AsyncStorage.getItem("userInfo");
      if (userInfoString) {
        const parsedUserInfo = JSON.parse(userInfoString);
        setUserInfo(parsedUserInfo);
      } else {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
      }
    } catch (error) {
      console.error("사용자 정보 로딩 에러:", error);
      Alert.alert("오류", "사용자 정보를 불러올 수 없습니다.");
    }
  };

  const handleKeyboardSubmit = () => {
    if (content.trim()) {
      handleSubmit();
    }
  };

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

  const formatTime = (hours, minutes) => {
    return `${hours.toString().padStart(2, "0")}시 ${minutes
      .toString()
      .padStart(2, "0")}분`;
  };

  const handleTimeSelect = (event, selectedTime, isStartTime) => {
    if (event.type === "set") {
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

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("알림", "제목과 내용을 모두 입력해주세요.");
      return;
    }

    if (Object.keys(selectedDates).length === 0) {
      Alert.alert("알림", "날짜를 선택해주세요.");
      return;
    }

    if (!startTime) {
      Alert.alert("알림", "시간을 선택해주세요.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("jwtToken");
      if (!token) {
        Alert.alert("알림", "로그인이 필요합니다.");
        navigation.navigate("KakaoLogin");
        return;
      }

      const formatTimeString = (timeStr) => {
        const [hours, minutes] = timeStr
          .split("시 ")
          .map((part) => part.replace("분", "").trim());
        return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
      };

      const selectedDate = Object.keys(selectedDates)[0];

      const postData = {
        title: title.trim(),
        content: content.trim(),
        imageUrls: selectedImages,
        carePostTag: "RECRUITING",
        isEmergency: isUrgent,
        careDate: selectedDate,
        startTime: formatTimeString(startTime),
        endTime: formatTimeString(endTime),
        postTime: formatTimeString(startTime),
      };

      console.log("Request data:", postData);

      const response = await fetch("http://3.34.96.14:8080/api/carePosts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      if (response.status === 200 || response.status === 201) {
        Alert.alert("성공", "게시글이 등록되었습니다.", [
          {
            text: "확인",
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }
    } catch (error) {
      console.error("게시글 등록 에러:", error);
      Alert.alert("오류", "게시글 등록에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const formatSelectedDates = () => {
    return Object.keys(selectedDates).sort().join(", ");
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
});

export default ChildCareNew;
