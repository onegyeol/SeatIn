import { useEffect, useState } from "react";
import StadiumScene from "../components/StadiumScene";
import Navbar from "../components/Navbar";
import styles from "../styles/SeatMap.module.css";  

export default function SeatMap() {
  const [sections, setSections] = useState(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]);
  const [seats, setSeats] = useState([]);
  const [currentSection, setCurrentSection] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [showView, setShowView] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  useEffect(() => {
    const updateSize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const fetchSeats = async (section) => {
    try {
      const res = await fetch(`http://localhost:8000/api/seats/?section=${section}`);
      if (!res.ok) throw new Error("좌석 데이터를 불러오지 못했습니다.");
      const data = await res.json();
      setSeats(data);
      setCurrentSection(section);
    } catch (err) {
      console.error("좌석 불러오기 실패:", err);
    }
  };

  const handleSeatClick = (seat) => {
    setSelectedSeat(seat);
    setShowView(true);
  };

  const handleCloseView = () => {
    setShowView(false);
    setSelectedSeat(null);
  };

  const { width: mapWidth, height: mapHeight } = dimensions;

  const minX = Math.min(...seats.map((s) => s.x));
  const maxX = Math.max(...seats.map((s) => s.x));
  const minY = Math.min(...seats.map((s) => s.y));
  const maxY = Math.max(...seats.map((s) => s.y));
  const scaleFactor = Math.min(mapWidth / 2000, mapHeight / 1600);

  const toScreenX = (x) =>
    ((x - minX) / (maxX - minX)) * (mapWidth * scaleFactor) + mapWidth * (1 - scaleFactor) / 2;
  const toScreenY = (y) =>
    ((y - minY) / (maxY - minY)) * (mapHeight * scaleFactor) + mapHeight * (1 - scaleFactor) / 3;

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        {!currentSection && (
          <>
            <h2 className={styles.title}>구역을 선택하세요</h2>

            <div className={styles.sectionRow}>
              {sections.slice(0, 5).map((sec) => (
                <button
                  key={sec}
                  onClick={() => fetchSeats(sec)}
                  className={styles.sectionBtn}
                >
                  {sec}
                </button>
              ))}
            </div>

            <div className={styles.mapWrapper}>
              <img src="/images/map.png" alt="stadium map" className={styles.mapImage} />
            </div>

            <div className={styles.sectionRow}>
              {sections.slice(5).map((sec) => (
                <button
                  key={sec}
                  onClick={() => fetchSeats(sec)}
                  className={styles.sectionBtn}
                >
                  {sec}
                </button>
              ))}
            </div>
          </>
        )}

        {currentSection && (
          <>
            <button
              onClick={() => {
                setCurrentSection(null);
                setSeats([]);
              }}
              className={styles.backBtn}
            >
              ← 구역 선택하기
            </button>

            <h2 className={styles.guideText}>
              좌석을 선택하면 해당 좌석의 시야를 확인할 수 있습니다.
            </h2>

            {seats.map((seat) => (
              <button
                key={seat.seat_id}
                title={seat.seat_id}
                onClick={() => handleSeatClick(seat)}
                className={`${styles.seatBtn} ${
                  selectedSeat?.seat_id === seat.seat_id ? styles.selectedSeat : ""
                }`}
                style={{
                  left: `${toScreenX(seat.x)}px`,
                  top: `${toScreenY(seat.y)}px`,
                }}
              />
            ))}

            {showView && (
              <div className={styles.viewModal}>
                <button onClick={handleCloseView} className={styles.closeBtn}>
                  ✕
                </button>
                <StadiumScene selectedSeat={selectedSeat} />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
