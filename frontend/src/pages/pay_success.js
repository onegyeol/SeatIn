import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styles from "../styles/PaySuccess.module.css";

export default function PaySuccessPage() {
  const router = useRouter();
  const { paymentKey, orderId, amount } = router.query;
  const [response, setResponse] = useState(null);
  
  useEffect(() => {
    if (paymentKey) {
      fetch("http://localhost:8000/api/payments/confirm/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      })
        .then(res => res.json())
        .then(data => setResponse(data));
    }
  }, [paymentKey]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img
          width="100"
          src="https://static.toss.im/illusts/check-blue-spot-ending-frame.png"
          alt="check"
          className={styles.icon}
        />
        <h2 className={styles.title}>결제가 완료되었습니다</h2>

        <div className={styles.infoBox}>
          <div className={styles.infoRow}>
            <b>경기명</b>
            <span>{amount}</span>
          </div>
          <div className={styles.infoRow}>
            <b>결제 금액</b>
            <span>{amount} 원</span>
          </div>
          <div className={styles.infoRow}>
            <b>주문 번호</b>
            <span>{orderId}</span>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button className={styles.homeButton} onClick={() => router.push("/home")}>
            홈으로
          </button>
          <button className={styles.confirmButton} onClick={() => router.push("/mypage")}>
            예매 내역 확인
          </button>
        </div>
      </div>
    </div>
  );
}