import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styles from "../styles/PaySuccess.module.css";

export default function PaySuccessPage() {
  const router = useRouter();
  const { paymentKey, orderId, amount, matchId } = router.query;
  const [response, setResponse] = useState(null);
  
  useEffect(() => {
    if (paymentKey) {
      fetch("http://localhost:8000/api/payments/confirm/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("access")}`,
         },
        body: JSON.stringify({ paymentKey, orderId, amount, matchId }),
      })
        .then((res) => res.json())
        .then((data) => setResponse(data))
        .catch((err) => console.error(err));
    }
  }, [paymentKey]);

  useEffect(() => {
  console.log("💡 router.query:", router.query);
}, [router.query]);


  const formattedDate = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img
          width="100"
          src="https://static.toss.im/illusts/check-blue-spot-ending-frame.png"
          alt="success"
          className={styles.icon}
        />
        <h2 className={styles.title}>결제가 완료되었습니다</h2>

        <div className={styles.infoBox}>
          <div className={styles.infoRow}>
            <b>경기명</b>
            <span>{matchId || "경기명"}</span>
          </div>
          <div className={styles.infoRow}>
            <b>결제 금액</b>
            <span>{Number(amount).toLocaleString()} 원</span>
          </div>
          <div className={styles.infoRow}>
            <b>결제 일시</b>
            <span>{formattedDate}</span>
          </div>
          <div className={styles.infoRow}>
            <b>주문 번호</b>
            <span>{orderId}</span>
          </div>
          <div className={styles.infoRow}>
            <b>결제 수단</b>
            <span>{response?.method || "카드 결제"}</span>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button className={styles.homeButton} onClick={() => router.push("/home")}>
            홈으로 돌아가기
          </button>
          <button className={styles.confirmButton} onClick={() => router.push("/mypage/pay")}>
            예매 내역 확인
          </button>
        </div>
      </div>
    </div>
  );
}