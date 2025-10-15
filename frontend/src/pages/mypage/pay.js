import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import MyPageSidebar from "../../components/MypageSidebar";
import styles from "../../styles/MyPayPage.module.css"; 

export default function PayPage() {
  const [payments, setPayments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  useEffect(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      home_logo: "/images/kcc.png",
      away_logo: "/images/samsung.png",
      match_title: `부산 KCC vs 서울 삼성 ${i + 1}`,
      stadium: "잠실 실내 체육관",
      amount: 150000,
      method: "신용 카드 결제",
    }));
    setPayments(data);
  }, []);

  const totalPages = Math.ceil(payments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPayments = payments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className={styles.container}>
      <Navbar />

      <div className={styles.layout}>
        {/* 사이드바 */}
        <div className={styles.sidebar}>
          <MyPageSidebar />
        </div>

        {/* 메인 */}
        <main className={styles.main}>
          <h1 className={styles.title}>결제 내역</h1>

          {/* 결제 카드 리스트 */}
          <div className={styles.grid}>
            {currentPayments.length > 0 ? (
              currentPayments.map((pay) => (
                <div key={pay.id} className={styles.card}>
                  <div className={styles.logoRow}>
                    <img src={pay.home_logo} alt="홈팀 로고" />
                    <span style={{ fontFamily: "NanumSquareNeo-Bold", fontSize: "18px", color: "#222" }}>
                      VS
                    </span>
                    <img src={pay.away_logo} alt="원정팀 로고" />
                  </div>

                  <p className={styles.matchTitle}>{pay.match_title}</p>
                  <p className={styles.stadium}>{pay.stadium}</p>
                  <p className={styles.amount}>₩{pay.amount.toLocaleString()}</p>
                  <p className={styles.method}>{pay.method}</p>
                </div>
              ))
            ) : (
              <p style={{ color: "#6b7280", textAlign: "center" }}>결제 내역이 없습니다.</p>
            )}
          </div>

          {/* 페이지네이션 */}
          <div className={styles.pagination}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={styles.pageBtn}
            >
              ◀
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`${styles.pageBtn} ${
                  currentPage === i + 1 ? styles.pageBtnActive : ""
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={styles.pageBtn}
            >
              ▶
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
