import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Search } from "lucide-react";
import Logo from "./Logo";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsLoggedIn(false);
    router.push("/");

    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "90px",
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "60px",
        padding: "20px 40px",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        fontFamily: "NanumSquareNeo, Pretendard, sans-serif",
        transition: "all 0.3s ease",
      }}
    >

      <div style={{ display: "flex", alignItems: "center" }}>
        <Logo />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          border: "1px solid #d1d5db",
          borderRadius: "9999px",
          padding: "8px 16px",
          width: "35%",
        }}
      >
        <input
          type="text"
          placeholder="공연, 경기, 지역 검색"
          style={{
            fontFamily: "NanumSquareNeo",
            width: "100%",
            border: "none",
            outline: "none",
            fontSize: "14px",
          }}
        />
        <Search
          style={{
            color: "#d1d5db",
            width: "20px",
            height: "20px",
          }}
        />
      </div>

      <nav
        style={{
          fontFamily: "NanumSquareNeo",
          display: "flex",
          gap: "24px",
          fontSize: "15px",
          color: "#4b5563",
        }}
      >
        {!isLoggedIn ? (
          <>
            <Link href="/login" style={navLinkStyle}>
              로그인
            </Link>
            <Link href="/signup" style={navLinkStyle}>
              회원가입
            </Link>
          </>
        ) : (
          <>
            <Link href="/mypage/pay" style={navLinkStyle}>
              마이페이지
            </Link>
            <span onClick={handleLogout} style={logoutStyle}>
              로그아웃
            </span>
          </>
        )}
        <Link href="/help" style={navLinkStyle}>
          고객센터
        </Link>
      </nav>
    </header>
  );
}

const navLinkStyle = {
  textDecoration: "none",
  color: "#4b5563",
  transition: "color 0.2s ease",
  cursor: "pointer",
};

const logoutStyle = {
  ...navLinkStyle,
  color: "#f76c6c",
  cursor: "pointer",
};
