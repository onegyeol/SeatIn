import { useState, useEffect, createContext } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";

export const AuthContext = createContext();

function MyApp({ Component, pageProps }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // localStorage에 access 토큰이 있으면 로그인 상태 유지
  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) setIsLoggedIn(true);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      <Component {...pageProps} />
    </AuthContext.Provider>
  );
}

export default MyApp;
