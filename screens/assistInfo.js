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
import Icon from "react-native-vector-icons/Ionicons";

const AssistInfo = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedTag, setSelectedTag] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 5;

  // 서버에서 데이터 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const jwtToken = await AsyncStorage.getItem("jwtToken");
        console.log("1. 사용중인 JWT 토큰:", jwtToken);

        const url = "http://3.34.96.14:8080/api/support-info";
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

  // 현재 페이지의 게시물만 가져오기
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  // 페이지 변경 함수
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  // 게시글 렌더링
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>지원정보</Text>
        </View>

        {/* 검색창 */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="검색어를 입력하세요"
              value={searchText}
              onChangeText={setSearchText}
            />
            <Icon
              name="search"
              size={24}
              color="#666"
              style={styles.searchIcon}
            />
          </View>
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
          data={currentPosts}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.postItem}
              onPress={() =>
                navigation.navigate("assistDetail", { postId: item.id })
              }
            >
              <View style={styles.postHeader}>
                <View style={styles.postTagContainer}>
                  {(item.tags || []).map((tag, index) => (
                    <View key={index} style={styles.postTagWrapper}>
                      <Text style={styles.postTagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.title}>{item.title}</Text>
              </View>
              <View style={styles.postInfo}>
                <Text style={styles.author}>{item.author}</Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          style={styles.listContainer}
        />

        {/* 페이지네이션 컨트롤 추가 */}
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[
              styles.pageButton,
              currentPage === 1 && styles.disabledButton,
            ]}
            onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <Text style={styles.pageButtonText}>{"<"}</Text>
          </TouchableOpacity>

          {[...Array(totalPages)].map((_, index) => (
            <Text
              key={index}
              style={[
                styles.pageText,
                currentPage === index + 1 && styles.selectedPageText,
              ]}
            >
              {index + 1}
            </Text>
          ))}

          <TouchableOpacity
            style={[
              styles.pageButton,
              currentPage === totalPages && styles.disabledButton,
            ]}
            onPress={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            <Text style={styles.pageButtonText}>{">"}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <BottomNavigation navigation={navigation} currentRoute="assistInfo" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBFBFB",
  },
  header: {
    padding: 16,
    marginTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontWeight: "bold",
  },
  searchIcon: {
    marginLeft: 10,
    color: "#acabb3",
  },
  tagFilterContainer: {
    flexDirection: "row",
    paddingVertical: 4,
    backgroundColor: "#FBFBFB",
  },
  tagButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 15,
    marginRight: 3,
    backgroundColor: "#f5f5f5",
  },
  selectedTagButton: {
    backgroundColor: "#FE9F40",
  },
  tagText: {
    fontSize: 14,
    color: "#666",
  },
  selectedTagText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  postItem: {
    padding: 16,
    borderRadius: 15,
    width: "110%",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  postTagContainer: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  postTagWrapper: {
    backgroundColor: "#FE9F40",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postTagText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  postInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  pageButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#F7F7F7",
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: "#f7f7f7",
    opacity: 0.5,
  },
  pageButtonText: {
    color: "#acabb3",
    fontWeight: "bold",
  },
  pageText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#acabb3",
  },
  selectedPageText: {
    color: "#FE9F40",
    fontWeight: "bold",
  },
});

export default AssistInfo;
