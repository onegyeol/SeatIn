from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.decorators import login_required
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from dj_rest_auth.registration.views import RegisterView
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.urls import reverse
from django.core.mail import EmailMultiAlternatives, send_mail
from django.shortcuts import redirect, render
from .serializers import CustomRegisterSerializer
from .tokens import account_activation_token
import requests, random
from .models import EmailVerification
from payments.models import Payment
from datetime import timedelta
from django.utils import timezone

User = get_user_model()

# 이메일 전송 함수
def send_activation_email(user, request):
    token = account_activation_token.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))

    domain = "localhost:8000"

    activate_url = f"http://{domain}{reverse('account_activate', kwargs={'uidb64': uid, 'token': token})}"

    mail_subject = "[SeatIn] 이메일 인증을 완료해주세요"

    # HTML 템플릿 렌더링
    html_message = render_to_string(
        "email/email_verification.html",
        {
            "user": user,
            "activate_url": activate_url,
        },
    )

    # 텍스트 버전 (HTML 제거)
    plain_message = strip_tags(html_message)

    # 이메일 생성 (멀티파트)
    email = EmailMultiAlternatives(
        subject=mail_subject,
        body=plain_message,
        from_email=settings.EMAIL_HOST_USER,
        to=[user.email],
    )
    email.attach_alternative(html_message, "text/html")

    email.send()


# 회원가입 API
@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = CustomRegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save(request)
        user.is_active = False
        user.save()
        send_activation_email(user, request)
        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 이메일 인증 API
def activate(request, uidb64, token):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = get_user_model().objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, get_user_model().DoesNotExist):
        return JsonResponse({"error": "Invalid user or token"}, status=400)

    if account_activation_token.check_token(user, token):
        user.is_active = True
        user.save()

        # 이메일 인증 후 JWT 자동 발급
        refresh = RefreshToken.for_user(user)
        return render(request, "email/email_verification_success.html", {
            "user": user,
        })
    else:
        return render(request, "email/email_verification_failed.html", status=400)

class CustomRegisterView(RegisterView):
    serializer_class = CustomRegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save(self.request)
        user.is_active = False  # 이메일 인증 전 비활성화
        user.save()
        send_activation_email(user, self.request)
        return user

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = self.perform_create(serializer)

        if not serializer.is_valid():
            print("Validation Error:", serializer.errors)  
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "회원가입이 완료되었습니다. 이메일 인증 후 로그인해주세요.",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)
        
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        if not self.user.is_active:
            raise serializers.ValidationError(
                {"detail": "이메일 인증을 완료해야 로그인할 수 있습니다."}
            )

        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# 네이버 로그인 콜백
@api_view(['GET'])
@permission_classes([AllowAny])
def naver_callback(request):
    code = request.GET.get("code")
    state = request.GET.get("state")

    if not code or not state:
        return Response({"error": "Missing code or state"}, status=status.HTTP_400_BAD_REQUEST)

    token_url = "https://nid.naver.com/oauth2.0/token"
    params = {
        "grant_type": "authorization_code",
        "client_id": settings.NAVER_CLIENT_ID,
        "client_secret": settings.NAVER_CLIENT_SECRET,
        "code": code,
        "state": state,
    }

    try:
        token_res = requests.get(token_url, params=params).json()
        access_token = token_res.get("access_token")

        if not access_token:
            return Response({"error": "Failed to get access token"}, status=status.HTTP_400_BAD_REQUEST)

        # 사용자 프로필 가져오기
        profile_res = requests.get(
            "https://openapi.naver.com/v1/nid/me",
            headers={"Authorization": f"Bearer {access_token}"}
        ).json()

        profile = profile_res.get("response")
        email = profile.get("email")
        name = profile.get("name", "")
        mobile = profile.get("mobile", "").replace("-", "") if profile.get("mobile") else None

        # 회원 생성 or 가져오기
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": name or email.split("@")[0],
                "phone": mobile,
                "is_active": True,
            }
        )

        # JWT 토큰 발급
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh_token = str(refresh)

        redirect_url = f"http://localhost:3000/auth/callback?access={access}&refresh={refresh_token}"
        return redirect(redirect_url)

    except requests.exceptions.RequestException as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 구글 로그인 콜백
@api_view(['GET'])
@permission_classes([AllowAny])
def google_callback(request):
    code = request.GET.get("code")
    if not code:
        return Response({"error": "Missing code"}, status=status.HTTP_400_BAD_REQUEST)

    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": "http://localhost:8000/api/users/google/callback/",
        "grant_type": "authorization_code",
    }

    try:
        # 토큰 요청
        token_res = requests.post(token_url, data=data).json()
        access_token = token_res.get("access_token")
        if not access_token:
            return Response({"error": "Failed to get access token"}, status=status.HTTP_400_BAD_REQUEST)

        # 사용자 프로필 요청
        profile_res = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        ).json()

        email = profile_res.get("email")
        name = profile_res.get("name", "")
        picture = profile_res.get("picture", "")

        if not email:
            return Response({"error": "Email not found in profile"}, status=status.HTTP_400_BAD_REQUEST)

        # 사용자 생성 or 가져오기
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": name or email.split("@")[0],
                "is_active": True,
            }
        )

        # JWT 토큰 발급
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh_token = str(refresh)

        redirect_url = f"http://localhost:3000/auth/callback?access={access}&refresh={refresh_token}"
        return redirect(redirect_url)

    except requests.exceptions.RequestException as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 카카오 로그인 콜백
@api_view(['GET'])
@permission_classes([AllowAny])
def kakao_callback(request):
    print("KAKAO_CLIENT_ID =", settings.KAKAO_CLIENT_ID)
    print("KAKAO_CLIENT_SECRET =", settings.KAKAO_CLIENT_SECRET)
    code = request.GET.get("code")
    if not code:
        return Response({"error": "Missing code"}, status=status.HTTP_400_BAD_REQUEST)

    token_url = "https://kauth.kakao.com/oauth/token"
    data = {
        "grant_type": "authorization_code",
        "client_id": settings.KAKAO_CLIENT_ID,  
        "redirect_uri": "http://localhost:8000/api/users/kakao/callback/",
        "code": code,
        "client_secret": getattr(settings, "KAKAO_CLIENT_SECRET", None),
    }

    try:
        # 액세스 토큰 요청
        token_res = requests.post(token_url, data=data).json()
        access_token = token_res.get("access_token")

        if not access_token:
            return Response(
                {"error": "Failed to get access token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 사용자 정보 요청
        profile_url = "https://kapi.kakao.com/v2/user/me"
        headers = {"Authorization": f"Bearer {access_token}"}
        profile_res = requests.get(profile_url, headers=headers).json()

        kakao_account = profile_res.get("kakao_account", {})
        email = kakao_account.get("email")
        profile = kakao_account.get("profile", {})
        nickname = profile.get("nickname", "")
        profile_image = profile.get("profile_image_url", "")

        # 전화번호는 비워둠 
        phone_number = None

        if not email:
            return Response(
                {"error": "Email not found in profile"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 사용자 생성 또는 기존 사용자 조회
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": nickname or email.split("@")[0],
                "is_active": True,
            },
        )

        # JWT 발급
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh_token = str(refresh)

        # 프론트엔드로 리다이렉트
        redirect_url = (
            f"http://localhost:3000/auth/callback?access={access}&refresh={refresh_token}"
        )
        return redirect(redirect_url)

    except requests.exceptions.RequestException as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@login_required
def my_page(request):
    member = request.user  # 현재 로그인한 사용자
    payments = Payment.objects.select_related('match').filter(member=member)

    return render(request, 'my_page.html', {
        'member': member,
        'payments': payments,
    })


# 결제 내역 전송
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_payments(request):
    member = request.user
    payments = Payment.objects.select_related('match').filter(member=member)

    data = [
        {
            "id": p.id,
            "amount": p.amount,
            "method": p.method,
            "status": p.status,
            "payment_time": p.payment_time,
            "match_title": p.match.title,
            "category": p.match.category,
            "poster1": p.match.poster1,
            "poster2": p.match.poster2,
            "date": p.match.date,
            "location": p.match.location,
        }
        for p in payments
    ]
    return Response(data)

# 결제한 경기 정보 전송
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_tickets(request):
    member = request.user
    payments = Payment.objects.select_related('match').filter(member=member)

    data = [
        {
            "id": p.id,
            "match_title": p.match.title,
            "category": p.match.category,
            "date": p.match.date,
            "location": p.match.location,
            "poster1": p.match.poster1,
            "poster2": p.match.poster2,
            "amount": p.amount,
            "method": p.method,
            "payment_time": p.payment_time,
        }
        for p in payments
    ]
    return Response(data)

# 정보수정 페이지 접근을 위한 이메일 인증코드 생성 / 전송
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_verification_code(request):
    user = request.user
    code = str(random.randint(100000, 999999))

    # 이전 코드 모두 삭제 후 새 코드 저장
    EmailVerification.objects.filter(user=user).delete()
    EmailVerification.objects.create(user=user, code=code)

    subject = "SeatIn 이메일 인증코드"
    from_email = settings.DEFAULT_FROM_EMAIL
    to_email = [user.email]

    html_content = render_to_string(
        "email/email_infoedit_verification.html",
        {
            "user_name": user.name if hasattr(user, "name") else user.username,
            "verification_code": code,
        },
    )
    text_content = f"SeatIn 인증코드: {code}\n\n10분 이내에 입력해주세요."

    email = EmailMultiAlternatives(subject, text_content, from_email, to_email)
    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=False)

    return Response({"message": f"{user.email}로 인증코드를 전송했습니다."})


# 인증코드 확인
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_email_code(request):
    input_code = request.data.get("code")
    user = request.user

    try:
        record = EmailVerification.objects.filter(user=user).latest("created_at")
    except EmailVerification.DoesNotExist:
        return Response({"error": "인증코드가 존재하지 않습니다."}, status=400)

    # 10분 이상 지난 인증코드는 만료 처리
    if timezone.now() - record.created_at > timedelta(minutes=10):
        record.delete()
        return Response({"error": "인증코드가 만료되었습니다."}, status=400)
   

    if record.code == input_code:
        record.delete()  # 사용 후 바로 삭제 (보안)
        return Response({"message": "이메일 인증 성공"})
    else:
        return Response({"error": "인증코드가 일치하지 않습니다."}, status=400)

# 회원 정보 조회
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def member_profile(request):
    user = request.user
    data = {
        "name": user.username,
        "email": user.email,
        "phone": getattr(user, "phone", None),
        "is_social": user.password == "" or user.password is None  # 소셜 로그인 회원은 비밀번호 없음
    }
    return Response(data)