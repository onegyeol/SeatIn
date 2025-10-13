import { useState, useContext } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Login.module.css";
import Head from "next/head";
import { AuthContext } from "./_app";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [animate, setAnimate] = useState(false);
  const { setIsLoggedIn } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/api/users/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        setIsLoggedIn(true);
        router.push("/");
      } else {
        if (data.detail === "이메일 인증을 완료해야 로그인할 수 있습니다.") {
          alert("이메일 인증을 먼저 완료해주세요!");
        } else {
          alert("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
      }
    } catch (err) {
      console.error("서버 오류:", err);
      alert("서버 연결에 문제가 발생했습니다.");
    }
  };

  // 소셜 로그인 리디렉션 함수
  const handleSocialLogin = (provider) => {
    const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;

    if (provider === "google") {
      const REDIRECT_URI = "http://localhost:8000/api/users/google/callback/";
      const scope =
        "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";

      const googleAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline`;

      window.location.href = googleAuthURL;
    }

    if (provider === "naver") {
      const REDIRECT_URI = "http://localhost:8000/api/users/naver/callback/";
      const STATE = "RANDOM_STATE_STRING";

      const naverAuthURL = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&state=${STATE}`;

      window.location.href = naverAuthURL;
    }
  };

  // 회원가입 페이지로 전환
  const handleSignupTransition = () => {
    setAnimate(true);
    setTimeout(() => router.push("/signup"), 600);
  };

  return (
    <>
      <Head>
        <title>SeatIn 로그인</title>
      </Head>

      <div className={styles.loginpage}>
        <h1 className={styles.logo} style={{ fontFamily: "Giants, sans-serif" }}>
          Seat<span className={styles.logoHighlight}>In</span>
        </h1>

        <div className={styles.container}>
          <div
            className={`${styles.box} ${animate ? styles.slideTransition : ""}`}
          >
            <div className={styles.loginLeft}>
              <h2
                className={styles.title}
                style={{ fontFamily: "Giants, sans-serif" }}
              >
                로그인
              </h2>

              <div className={styles.socials}>
                <img src="/kakao.png" alt="kakao" />
                <img
                  src="/google.png"
                  alt="google"
                  onClick={() => handleSocialLogin("google")}
                  style={{ cursor: "pointer" }}
                />
                <img
                  src="/naver.png"
                  alt="naver"
                  onClick={() => handleSocialLogin("naver")}
                  style={{ cursor: "pointer" }}
                />
              </div>

              <input
                type="email"
                placeholder="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ fontFamily: "NanumSquareNeo, sans-serif" }}
              />
              <input
                type="password"
                placeholder="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ fontFamily: "NanumSquareNeo, sans-serif" }}
              />
              <a
                href="#"
                className={styles.findPw}
                style={{ fontFamily: "NanumSquareNeo, sans-serif" }}
              >
                비밀번호 찾기
              </a>

              <button
                onClick={handleLogin}
                className={styles.loginBtn}
                style={{ fontFamily: "Giants, sans-serif" }}
              >
                로그인
              </button>
            </div>

            <div className={styles.loginRight}>
              <h2
                className={styles.welcome}
                style={{ fontFamily: "Giants, sans-serif" }}
              >
                안녕하세요!
              </h2>
              <p style={{ fontFamily: "NanumSquareNeo, sans-serif" }}>
                아직 회원이 아니신가요?
              </p>

              <button
                onClick={handleSignupTransition}
                className={styles.signupBtn}
                style={{ fontFamily: "Giants, sans-serif" }}
              >
                회원가입
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
