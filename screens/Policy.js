import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const Policy = ({ navigation }) => {
  const policies = [
    {
      title: "서비스 이용약관",
      content: `제1조 (목적)
이 약관은 다:품(이하 "회사"라 합니다)이 제공하는 서비스의 이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
1. "서비스"란 회사가 제공하는 모든 서비스를 의미합니다.
2. "회원"이란 회사와 서비스 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 개인을 의미합니다.

제3조 (약관의 효력 및 변경)
1. 이 약관은 서비스를 이용하고자 하는 모든 회원에 대하여 그 효력을 발생합니다.
2. 회사는 약관의 규제에 관한 법률 등 관련법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.`,
    },
    {
      title: "개인정보 처리방침",
      content: `1. 개인정보의 수집 및 이용 목적
회사는 다음의 목적을 위하여 개인정보를 처리합니다.
- 회원 가입 및 관리
- 서비스 제공 및 운영
- 고객 상담 및 불만 처리

2. 수집하는 개인정보의 항목
- 필수항목: 이름, 닉네임, 이메일 주소
- 선택항목: 프로필 이미지, 연락처

3. 개인정보의 보유 및 이용기간
회원 탈퇴 시까지 또는 법령에서 정한 보존기간까지`,
    },
    {
      title: "위치기반 서비스 이용약관",
      content: `제1조 (목적)
이 약관은 회사가 제공하는 위치기반 서비스와 관련하여 회사와 회원과의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (서비스의 내용)
회사는 위치정보를 이용하여 다음과 같은 서비스를 제공합니다.
1. 주변 지역 기반 정보 제공
2. 위치기반 커뮤니티 서비스
3. 생활 편의 서비스`,
    },
  ];

  const renderPolicyItem = ({ title, content }) => (
    <View style={styles.policyItem} key={title}>
      <TouchableOpacity
        style={styles.policyHeader}
        onPress={() => {
          navigation.navigate("PolicyDetail", { title, content });
        }}
      >
        <Text style={styles.policyTitle}>{title}</Text>
        <Icon name="chevron-right" size={24} color="#666" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {policies.map((policy) => renderPolicyItem(policy))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.infoText}>다:품 버전 1.0.0</Text>
        <Text style={styles.copyrightText}>
          Copyright © 2024 다:품 All rights reserved.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  policyItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  policyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  policyTitle: {
    fontSize: 16,
    color: "#333",
  },
  footer: {
    padding: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  copyrightText: {
    fontSize: 12,
    color: "#999",
  },
});

export default Policy;
