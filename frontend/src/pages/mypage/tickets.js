import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import MyPageSidebar from "../../components/MypageSidebar";
import styles from "../../styles/MyTicketPage.module.css";

export default function InfoPage() {
  const [tickets, setTickets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/users/tickets/", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`, 
          },
        });
        if (!res.ok) throw new Error("티켓 내역을 불러오지 못했습니다.");
        const data = await res.json();
        setTickets(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchTickets();
  }, []);

  const totalPages = Math.ceil(tickets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentTickets = tickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
          <h1 className={styles.title}>마이 티켓</h1>

          {/* 티켓 카드 리스트 */}
          <div className={styles.grid}>
            {currentTickets.length > 0 ? (
              currentTickets.map((ticket) => (
                <div key={ticket.id} className={styles.card}>
                  <div className={styles.logoRow}>
                    <img src={ticket.poster1} alt="홈팀 로고" />
                    <span
                      style={{
                        fontFamily: "NanumSquareNeo-Bold",
                        fontSize: "18px",
                        color: "#222",
                      }}
                    >
                      VS
                    </span>
                    <img src={ticket.poster2} alt="원정팀 로고" />
                  </div>

                  <p className={styles.matchTitle}>{ticket.match_title}</p>
                  <p className={styles.category}>{ticket.category}</p>
                  <p className={styles.date}>
                    {new Date(ticket.date).toLocaleDateString()}{" "}
                    {new Date(ticket.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className={styles.location}>{ticket.location}</p>
                </div>
              ))
            ) : (
              <p style={{ color: "#6b7280", textAlign: "center" }}>
                구매한 티켓이 없습니다.
              </p>
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
