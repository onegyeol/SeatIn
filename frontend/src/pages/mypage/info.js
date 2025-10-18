import { useState } from "react";
import Navbar from "../../components/Navbar";
import MyPageSidebar from "../../components/MypageSidebar";
import styles from "../../styles/MyInfoPage.module.css";

export default function InfoPage() {
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [modalMessage, setModalMessage] = useState("이메일 인증코드 확인");
  const [memberInfo, setMemberInfo] = useState(null);
  const [isSocialLogin, setIsSocialLogin] = useState(false);

  // 인증코드 전송
  const sendCode = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/users/send-code/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });
      const data = await res.json();
      setModalMessage("이메일로 전송된 인증코드를 입력해주세요.");
    } catch (err) {
      setModalMessage("인증코드 전송 실패");
    }
  };

  // 인증코드 검증 후 회원정보 불러오기
  const verifyCode = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/users/verify-code/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (data.message) {
        // 인증 성공 → 회원정보 조회
        const infoRes = await fetch("http://localhost:8000/api/users/profile/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        });
        const infoData = await infoRes.json();
        if (infoData.is_social) setIsSocialLogin(true);
        setMemberInfo(infoData);
        setShowModal(false);
      } else {
        setModalMessage(data.error || "인증 실패");
      }
    } catch (err) {
      setModalMessage("서버 오류가 발생했습니다.");
    }
  };

  return (
    <div className={styles.container}>
      <Navbar />

      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <MyPageSidebar />
        </div>

        <main className={styles.main}>
          <h1 className={styles.title}>회원 정보</h1>

          {!memberInfo && (
            <div className={styles.verifyBox}>
              <p>회원 정보를 조회하려면 이메일 인증이 필요합니다.</p>
              <button
                onClick={() => setShowModal(true)}
                className={styles.mainBtn}
              >
                이메일 인증하기
              </button>
            </div>
          )}

          {memberInfo && (
            <div className={styles.infoBox}>
              <div className={styles.infoRow}>
                <span className={styles.label}>이름</span>
                <span className={styles.value}>{memberInfo.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>이메일</span>
                <span className={styles.value}>{memberInfo.email}</span>
              </div>
              {isSocialLogin ? (
                <p className={styles.socialNotice}>간편 로그인한 회원입니다.</p>
              ) : (
                <>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>비밀번호</span>
                    <span className={styles.value}>OOOOOO</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.label}>전화번호</span>
                    <span className={styles.value}>
                      {memberInfo.phone || "-"}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ✅ 모달창 */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>이메일 인증코드 확인</h3>
            <p>회원 정보를 조회하려면 이메일 인증이 필요합니다.</p>
            <div className={styles.modalInputBox}>
              <input
                type="text"
                placeholder="인증 번호"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={styles.modalInput}
              />
              <button onClick={sendCode} className={styles.modalSubBtn}>
                인증코드 전송
              </button>
            </div>
            <p className={styles.modalHint}>인증번호가 전송되지 않았나요?</p>
            <button onClick={verifyCode} className={styles.modalButton}>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
