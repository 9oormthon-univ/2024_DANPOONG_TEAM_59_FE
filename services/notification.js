const subscribeToNotifications = async (userId) => {
  try {
    const response = await fetch(
      `http://3.34.96.14:8080/api/notification/token`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );
    // ...
  } catch (error) {
    console.error("알림 구독 실패:", error);
  }
};
