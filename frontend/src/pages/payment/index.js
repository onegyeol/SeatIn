// pages/payment/index.js
import { useState } from "react";

export default function PaymentPage() {
  const [amount, setAmount] = useState(1000);

  const handlePay = async () => {
    try {
      const response = await fetch("https://api.tosspayments.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY + ":"),
        },
        body: JSON.stringify({
          amount,
          orderId: "order_" + new Date().getTime(),
          orderName: "SeatIn 티켓",
          cardNumber: "4111111111111111",
          cardExpirationYear: "25",
          cardExpirationMonth: "12",
          cardPassword: "12",
          customerIdentityNumber: "860824",
        }),
      });

      const data = await response.json();
      console.log("결제 요청 결과:", data);

      if (response.ok && data.paymentKey) {
        const confirm = await fetch("http://127.0.0.1:8000/payments/confirm/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentKey: data.paymentKey,
            orderId: data.orderId,
            amount: data.totalAmount,
          }),
        });
        console.log("서버 confirm 응답:", await confirm.json());
      } else {
        alert("결제 요청 실패: " + data.message);
      }
    } catch (err) {
      console.error("결제 에러:", err);
    }
  };

  return (
    <div>
      <h2>API 개별 연동 결제 테스트</h2>
      <p>결제 금액: {amount}원</p>
      <button onClick={handlePay}>카드로 결제하기</button>
    </div>
  );
}
