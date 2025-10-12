from django.db import models
from django.utils import timezone
from users.models import Member
from match.models import Match

class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ("toss", "토스페이먼츠"),
        ("kakao", "카카오페이"),
        ("card", "신용카드"),
        ("naver", "네이버페이"),
    ]

    STATUS_CHOICES = [
        ("ready", "결제대기"),
        ("completed", "결제완료"),
        ("failed", "결제실패"),
        ("cancelled", "결제취소"),
        ("refunded", "환불완료"),
    ]

    id = models.BigAutoField(primary_key=True)
    member = models.ForeignKey(Member, on_delete=models.SET_NULL, null=True, blank=True, related_name="payments")
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="payments")  # 경기 정보 연결

    amount = models.PositiveIntegerField()  
    method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default="toss")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ready")

    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"[{self.get_status_display()}] {self.match.title} - {self.amount}원"