import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";

const KaKaoLogin = () => {
  const navigation = useNavigation();

  return (
    <View style={Styles.container}>
      <Image
        source={require("../assets/background.png")}
        style={Styles.backgroundImage}
      />
      <Text style={Styles.MainText}>다:품에오신 것을{"\n"}환영합니다.</Text>
      <Text style={Styles.SubText}>다:품은 서로 도움을 주고 받는</Text>
      <Text style={Styles.SubText}>한부모 가정을 위한 커뮤니티 입니다.</Text>
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
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  MainText: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "left",
    marginTop: "40%",
    marginBottom: "5%",
    marginLeft: "8%",
  },
  SubText: {
    fontSize: 16,
    textAlign: "left",
    marginLeft: "8%",
  },
  kakaoButton: {
    height: 50,
    width: 340,
    borderRadius: 10,
    alignSelf: "center",
  },
  logo2: {
    height: 250,
    width: 250,
    marginBottom: 170,
    marginTop: 58,
    resizeMode: "contain",
    alignSelf: "center",
  },
});
