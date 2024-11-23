import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import BottomNavigation from "../components/BottomNavigation";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AssistInfo = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState("전체");

  // 서버에서 데이터 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const jwtToken = await AsyncStorage.getItem("jwtToken");
        console.log("1. 사용중인 JWT 토큰:", jwtToken);

        const url = "http://192.168.61.45:8080/api/support-info";
        console.log("2. 요청 URL:", url);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });

        console.log("3. 서버 응답 상태:", response.status);
        const responseText = await response.text();
        console.log("4. 서버 응답 원본:", responseText);

        const data = JSON.parse(responseText);
        console.log("5. 파싱된 데이터:", data);

        // 각 게시물의 태그 데이터 확인
        data.forEach((post, index) => {
          console.log(`6. 게시물 ${index}의 태그:`, post.tags);
        });

        if (data && Array.isArray(data)) {
          const formattedPosts = data.map((post) => {
            const formattedPost = {
              id: post.id.toString(),
              title: post.title,
              tags: Array.isArray(post.tags) ? post.tags : ["기타지원"],
              author: `[${post.department}]`,
              date: new Date(post.updatedAt).toLocaleDateString("ko-KR"),
            };
            console.log(
              `7. 변환된 게시물 ${post.id}의 태그:`,
              formattedPost.tags
            );
            return formattedPost;
          });

          setPosts(formattedPosts);
          console.log("8. 최종 설정된 posts:", formattedPosts);
        }
      } catch (error) {
        console.error("데이터 가져오기 실패:", error);
      }
    };

    fetchPosts();
  }, []);

  // 검색과 태그 필터링
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesTag =
      selectedTag === "전체" ||
      post.tags.some((tag) => `#${tag}` === selectedTag);
    return matchesSearch && matchesTag;
  });

  // 게시글 렌더링
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>지원정보</Text>
        </View>

        {/* 검색창 */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="검색어를 입력하세요"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* 태그 필터 */}
        <View style={styles.tagFilterContainer}>
          {["전체", "#주거지원", "#의료지원", "#교육비지원", "#기타지원"].map(
            (tags) => (
              <TouchableOpacity
                key={tags}
                style={[
                  styles.tagButton,
                  selectedTag === tags && styles.selectedTagButton,
                ]}
                onPress={() => setSelectedTag(tags)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTag === tags && styles.selectedTagText,
                  ]}
                >
                  {tags}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {/* 게시글 목록 표시를 위한 FlatList 추가 */}
        <FlatList
          data={filteredPosts}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.postItem}
              onPress={() =>
                navigation.navigate("assistDetail", { postId: item.id })
              }
            >
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.postInfo}>
                <View style={styles.leftInfo}>
                  <Text style={styles.author}>{item.author}</Text>
                  <Text style={styles.date}>{item.date}</Text>
                </View>
                <View style={styles.tagContainer}>
                  {(item.tags || []).map((tag, index) => (
                    <Text key={index} style={styles.tag}>
                      #{tag}
                    </Text>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          style={styles.listContainer}
        />
      </View>
      <BottomNavigation navigation={navigation} currentRoute="assistInfo" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
    marginTop: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  tagFilterContainer: {
    flexDirection: "row",
    paddingVertical: 9,
    backgroundColor: "#fff",
  },
  tagButton: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#f5f5f5",
  },
  selectedTagButton: {
    backgroundColor: "#FFEDAE",
  },
  tagText: {
    fontSize: 14,
    color: "#666",
  },
  selectedTagText: {
    color: "#000",
    fontWeight: "bold",
  },
  postItem: {
    padding: 16,
    borderRadius: 10,
    width: "90%",
    alignSelf: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  postInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftInfo: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 5,
  },
  author: {
    color: "black",
  },
  date: {
    color: "#666",
  },
  writeButton: {
    position: "absolute",
    right: 20,
    bottom: 50,
    backgroundColor: "#FFEDAE",
    padding: 16,
    borderRadius: 30,
  },
  writeButtonText: {
    color: "black",
    fontWeight: "bold",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  tag: {
    fontSize: 12,
    color: "#666",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    padding: 16,
  },
  interactionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  interactionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  interactionText: {
    fontSize: 14,
    color: "#666",
  },
});

export default AssistInfo;
