import io from "socket.io-client";

const socket = io("http://3.34.96.14:8080");

socket.on("newUrgentPost", (data) => {
  // 새로운 긴급 게시물 알림 수신
  setInAppNotification({
    title: "새로운 긴급 돌봄 요청",
    body: data.title,
    postId: data.carePostId,
  });
});
