import { useEffect, useState } from "react";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import { useRouter } from "next/router";
import styles from "../styles/Pay.module.css";

export default function PaymentPage() {
  const router = useRouter();
  const { matchId } = router.query; 
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    fetch(`http://localhost:8000/api/match/${matchId}/`)
      .then((res) => res.json())
      .then((data) => setMatch(data))
      .catch((err) => console.error(err));
  }, [matchId]);

  const handlePayment = async () => {
    if (!match) return alert("경기 정보를 불러오는 중입니다.");

    try {
      setLoading(true);
      const tossPayments = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
      );

      const orderId = "order_" + new Date().getTime();
      const amount = 15000;

      await tossPayments.requestPayment("카드", {
        amount,
        orderId,
        orderName: match.title,
        successUrl: "http://localhost:3000/pay_success",
        failUrl: "http://localhost:3000/pay_fail",
      });
    } catch (e) {
      console.error("결제 요청 실패:", e);
      alert("결제 요청 중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!match) return <div className={styles.loading}>경기 정보를 불러오는 중...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <section className={styles.matchSection}>
          <div className={styles["match-logos-center"]}>
            <img
              src={match.poster1_url || `http://127.0.0.1:8000${match.poster1}`}
              alt="팀 로고"
              className={styles["team-logo"]}
            />
            <span className={styles["vs-text"]}>VS</span>
            <img
              src={match.poster2_url || `http://127.0.0.1:8000${match.poster2}`}
              alt="팀 로고"
              className={styles["team-logo"]}
            />
          </div>
          <div className={styles.matchInfo}>
            <h1 className={styles.matchTitle}>{match.title}</h1>
            <p className={styles.matchDate}>{new Date(match.date).toLocaleString()}</p>
            <p className={styles.matchLocation}> {match.location}</p>
            <p className={styles.matchCategory}>카테고리: {match.category}</p>
          </div>
        </section>

        <section className={styles.paymentSection}>
          <h2>결제 정보</h2>
          <div className={styles.paymentDetail}>
            <p><b>예매 금액:</b> 15,000원</p>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className={styles.payButton}
          >
            {loading ? "결제 진행 중..." : "결제하기"}
          </button>
        </section>
      </div>
    </div>
  );
}