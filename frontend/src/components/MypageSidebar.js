import Link from "next/link";

export default function MyPageSidebar() {
  return (
    <aside
      style={{
        position: "flex",        
        top: 0,
        left: 0,
        left: "20%",
        height: "70%",   
        width: "260px",  
        borderRadius: 20,     
        backgroundColor: "#283577", 
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        boxShadow: "2px 0 10px rgba(0,0,0,0.15)",
        zIndex: 1000,
      }}
    >
      <div style={{ textAlign: "left", marginBottom: "60px" }}>
        <h1
          style={{
            fontFamily: "Giants-Bold",
            fontSize: "30px",
            fontWeight: "bold",
            lineHeight: "1.6",
            marginBottom: "10px",
          }}
        >
          안녕하세요!<br />최한결님
        </h1>
        <button
          onClick={() => (window.location.href = "/mypage/info")}
          style={{
            backgroundColor: "#FFB84D",
            color: "#283577",
            border: "none",
            borderRadius: "8px",
            padding: "10px 16px",
            cursor: "pointer",
            fontSize: "18px",
          }}
        >
          정보 수정
        </button>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "25px", width: "100%", textAlign: "center"}}>
        <Link href="/mypage/pay" style={linkStyle}>
          결제 내역
        </Link>
        <Link href="/mypage/tickets" style={linkStyle}>
          마이 티켓
        </Link>
      </nav>

      <div style={{ marginTop: "auto", paddingTop: "60px" }}>
        <img
          src="/sports-icon.png"
          alt="스포츠 아이콘"
          width={200}
          style={{ opacity: 0.9 }}
        />
      </div>
    </aside>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  fontSize: "20px",
  transition: "color 0.2s",
};

