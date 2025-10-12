import { useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { AuthContext } from "../_app";

export default function AuthCallback() {
  const router = useRouter();
  const { setIsLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    const { access, refresh } = router.query;
    if (access && refresh) {
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      setIsLoggedIn(true);

      // 토큰 저장 후 메인으로 이동
      router.replace("/");
    }
  }, [router.query, setIsLoggedIn]);

  return (
    <div style={{ textAlign: "center", marginTop: "200px" }}>
      <h2>로그인 중입니다...</h2>
      <p>잠시만 기다려 주세요.</p>
    </div>
  );
}
