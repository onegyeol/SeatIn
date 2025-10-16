from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class MemberManager(BaseUserManager):
    def create_user(self, email, password=None, username=None, phone=None, **extra_fields):
        if not email:
            raise ValueError("이메일은 필수입니다.")
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, phone=phone, **extra_fields)
        user.set_password(password)  # 비밀번호 해시 저장
        user.is_active = False  # 기본적으로 회원을 비활성화 상태로 설정
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        # 관리자 생성 시에도 최소 필드로
        return self.create_user(email, password, **extra_fields)


class Member(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=50, blank=True, null=True, unique=False)
    phone = models.BigIntegerField(blank=True, null=True)
    is_active = models.BooleanField(default=False)  # 이메일 인증 후 활성화 여부

    objects = MemberManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return f"{self.username} ({self.email})"
