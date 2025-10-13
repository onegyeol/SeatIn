from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
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
from django.core.mail import EmailMultiAlternatives
from django.shortcuts import redirect, render
from .serializers import CustomRegisterSerializer
from .tokens import account_activation_token
import requests

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
