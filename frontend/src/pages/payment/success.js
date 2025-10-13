import { useRouter } from "next/router";
import { useState } from "react";

export default function SuccessPage() {
  const router = useRouter();
  const { paymentKey, orderId, amount } = router.query;
  const [result, setResult] = useState(null);

  const confirmPayment = async () => {
    const res = await fetch("http://127.0.0.1:8000/payments/confirm/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div>
      <h2>결제 성공 (임시 상태)</h2>
      <p>결제금액: {amount}원</p>
      <p>주문번호: {orderId}</p>
      <p>paymentKey: {paymentKey}</p>
      <button onClick={confirmPayment}>결제 승인 요청</button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
