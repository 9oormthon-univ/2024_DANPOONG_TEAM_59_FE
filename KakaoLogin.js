import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";

const KaKaoLogin = () => {
  const navigation = useNavigation();

  return (
    <View style={Styles.container}>
      <Text style={Styles.MainText}>다:품에{"\n"}오신 것을 환영해요!</Text>
      <Image source={require("../assets/logo2.png")} style={Styles.logo2} />
      <TouchableOpacity
        onPress={() => navigation.navigate("kakao")}
        style={Styles.NextBottom}
      >
        <Image
          source={require("../assets/kakaoLogin.png")}
          style={Styles.kakaoButton}
        />
      </TouchableOpacity>
    </View>
  );
};

export default KaKaoLogin;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  MainText: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "left",
    marginTop: "40%",
    marginLeft: "25%",
  },
  kakaoButton: {
    height: 50,
    width: "50%",
    borderRadius: 10,
    alignSelf: "center",
  },
  logo2: {
    height: 400,
    width: 400,
    resizeMode: "contain",
    alignSelf: "center",
  },
});
