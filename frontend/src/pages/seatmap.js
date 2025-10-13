import { useEffect, useState } from "react";
import StadiumScene from "../components/StadiumScene";

export default function SeatMap() {
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [showView, setShowView] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/api/seats/")
      .then((res) => res.json())
      .then(setSeats)
      .catch(console.error);
  }, []);

  const { width: mapWidth, height: mapHeight } = dimensions;

  const minX = Math.min(...seats.map((s) => s.x));
  const maxX = Math.max(...seats.map((s) => s.x));
  const minY = Math.min(...seats.map((s) => s.y));
  const maxY = Math.max(...seats.map((s) => s.y));

  const toScreenX = (x) =>
    ((x - minX) / (maxX - minX)) * (mapWidth - 40) + 20;
  const toScreenY = (y) =>
    ((y - minY) / (maxY - minY)) * (mapHeight - 40) + 20;

  const handleSeatClick = (seat) => {
    setSelectedSeat(seat);
    setShowView(true);
  };

  const handleCloseView = () => {
    setShowView(false);
    setSelectedSeat(null);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        background: "#94e280ff",
        overflow: "hidden",
      }}
    >
      {seats.map((seat) => (
        <button
          key={seat.seat_id}
          title={seat.seat_id}
          onClick={() => handleSeatClick(seat)}
          style={{
            position: "absolute",
            left: `${toScreenX(seat.x)}px`,
            top: `${toScreenY(seat.y)}px`,
            transform: "translate(-50%, -50%)",
            width: "8px",
            height: "8px",
            border: "1px solid #bebebeff",
            background:
              selectedSeat?.seat_id === seat.seat_id ? "orange" : "#2b71ffff",
            cursor: "pointer",
          }}
        />
      ))}

      {showView && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "400px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
            zIndex: 10,
            borderRadius: "12px",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <button
            onClick={handleCloseView}
            style={{
              position: "absolute",
              top: "8px",
              right: "10px",
              border: "none",
              background: "transparent",
              fontSize: "23px",
              cursor: "pointer",
              zIndex: 100,
            }}
          >
            ✕
          </button>
          <StadiumScene selectedSeat={selectedSeat} />
        </div>
      )}
    </div>
  );
}
