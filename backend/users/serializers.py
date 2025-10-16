from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class CustomRegisterSerializer(RegisterSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, username):
        return username  

    # 이메일 중복만 검사 
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("이미 가입된 이메일입니다.")
        return value

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data['username'] = self.validated_data.get('username', '')
        data['phone'] = self.validated_data.get('phone', '')
        return data

    def save(self, request):
        user = super().save(request)
        # username이 비어 있으면 이메일 앞부분으로 자동 설정
        user.username = self.validated_data.get("username") or user.email.split("@")[0]
        user.phone = self.validated_data.get("phone", None)
        user.save()
        return user
