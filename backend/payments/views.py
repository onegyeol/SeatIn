import os
import requests
import base64
import json
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Payment
from match.models import Match

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def confirm_payment(request):
    try:
        data = json.loads(request.body)
        payment_key = data.get("paymentKey")
        order_id = data.get("orderId")
        amount = data.get("amount")
        title = data.get("matchId")
        method = data.get("method", "toss")

        secret_key = os.getenv("TOSS_SECRET_KEY")
        basic_token = base64.b64encode((secret_key + ":").encode("utf-8")).decode("utf-8")

        url = "https://api.tosspayments.com/v1/payments/confirm"
        headers = {
            "Authorization": f"Basic {basic_token}",
            "Content-Type": "application/json",
        }
        body = {
            "paymentKey": payment_key,
            "orderId": order_id,
            "amount": amount,
        }

        response = requests.post(url, json=body, headers=headers)
        result = response.json()

        if response.status_code == 200:
            match = None
            match_title = None
            try:
                match = Match.objects.get(id=title) 
                match_title = match.title
            except Match.DoesNotExist:
                return Response({"error": "해당 경기(title)를 찾을 수 없습니다."}, status=404)

            Payment.objects.create(
                member=request.user,
                match=match,
                method=result.get("method", method),
                amount=amount,
                status="completed",
                payment_time=timezone.now(), 
            )

            return Response({
                "message": "결제 성공",
                "orderId": order_id,
                "orderName": result.get("orderName"),
                "matchTitle": match_title,
                "method": result.get("method"),
                "approvedAt": result.get("approvedAt"),
                "toss_response": result
            })
        
        return Response(result, status=response.status_code)
    
    except Exception as e:
        import traceback
        print("❌ 서버 에러:", e)
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
