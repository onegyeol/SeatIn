import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import styles from "../styles/home.module.css";
import Logo from "../components/Logo";

const banners = ["/images/banner1.png", "/images/banner2.png", "/images/banner3.png"];
const categories = ["전체", "K리그", "KBO", "KBL", "프리미어리그"];

export default function HomePage() {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [matches, setMatches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 16;
  const filteredMatches = matches.filter(
    (m) => activeCategory === "전체" || m.category === activeCategory
  );


  const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentMatches = filteredMatches.slice(startIndex, endIndex);

  const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % banners.length);
  const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/match/")
      .then((res) => res.json())
      .then((data) => setMatches(data))
      .catch((err) => console.error("데이터 불러오기 실패:", err));
  }, []);

  return (
    <main className={styles["home-container"]}>
      {/* 상단 네비게이션 */}
      <header className={styles.navbar}>
        <Logo />

        <div className={styles["search-bar"]}>
          <input type="text" placeholder="공연, 경기, 지역 검색" />
          <Search className={styles.icon} />
        </div>

        <nav className={styles["nav-links"]}>
          <Link href="/login">로그인</Link>
          <Link href="/signup">회원가입</Link>
          <Link href="/help">고객센터</Link>
        </nav>
      </header>

      {/* 배너 */}
      <section className={styles["banner-section"]}>
        <Image src={banners[currentBanner]} alt="배너" fill className={styles["banner-image"]} />
        <button onClick={prevBanner} className={`${styles["banner-btn"]} ${styles.left}`}>
          <ChevronLeft />
        </button>
        <button onClick={nextBanner} className={`${styles["banner-btn"]} ${styles.right}`}>
          <ChevronRight />
        </button>
      </section>

      {/* 카테고리 */}
      <section className={styles["category-section"]}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`${styles["category-btn"]} ${activeCategory === cat ? styles.active : ""}`}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* 경기 목록 */}
      <section className={styles["match-list"]}>
        <h1>경기 목록</h1>
        <div className={styles["match-grid"]}>
          {currentMatches.length > 0 ? (
            currentMatches.map((match) => (
              <div key={match.id} className={styles["match-card"]}>

                {/* ✅ 로고 중앙 배치 */}
                <div className={styles["match-logos-center"]}>
                  <img
                    src={match.poster1_url}
                    alt="원정팀 로고"
                    className={styles["team-logo"]}
                  />
                  <span className={styles["vs-text"]}>VS</span>
                  <img
                    src={match.poster2_url}
                    alt="홈팀 로고"
                    className={styles["team-logo"]}
                  />
                </div>

                {/* ✅ 경기 정보 */}
                <div className={styles.info}>
                  <p className={styles.title}>{match.title}</p>
                  <p>{match.category}</p>
                  <p>{match.location}</p>
                  <p>
                    {new Date(match.date).toLocaleString("ko-KR", {
                      timeZone: "Asia/Seoul",  
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.loading}>데이터를 불러오는 중입니다...</p>
          )}
        </div>
        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className={styles["pagination"]}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`${styles["page-btn"]} ${
                  currentPage === i + 1 ? styles.active : ""
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </section>


    </main>
  );
}
