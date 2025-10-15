from django.urls import path
from . import views
from .views import CustomRegisterView, CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # 회원가입 / 이메일 인증
    path("signup/", views.signup, name="signup"),
    path("activate/<uidb64>/<token>/", views.activate, name="account_activate"),
    path("register/", CustomRegisterView.as_view(), name="custom_register"),

    # JWT 로그인 / 갱신
    path("login/", views.CustomTokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # 소셜 로그인 콜백
    path("naver/callback/", views.naver_callback, name="naver_callback"),
    path("google/callback/", views.google_callback, name="google_callback"),
    path("kakao/callback/", views.kakao_callback, name="kakao_callback"),
]