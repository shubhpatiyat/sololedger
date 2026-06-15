import re

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


PASSWORD_COMPLEXITY_REGEX = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)
    first_name: str | None = Field(default=None, max_length=120)
    last_name: str | None = Field(default=None, max_length=120)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if not PASSWORD_COMPLEXITY_REGEX.match(value):
            raise ValueError(
                "Password must contain at least one uppercase letter, one lowercase letter, and one number"
            )
        return value

    @model_validator(mode="after")
    def validate_passwords_match(self) -> "SignUpRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class AuthUserResponse(BaseModel):
    id: str
    email: EmailStr
    name: str | None = None


class LoginResponse(BaseModel):
    success: bool = True
    status: int = 200
    message: str = "Login successful"
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: AuthUserResponse


class SignUpResponse(BaseModel):
    success: bool = True
    status: int = 201
    message: str = "Signup successful. Please verify your email."
    email: EmailStr
    verification_email_sent: bool = True


class RefreshTokenResponse(BaseModel):
    success: bool = True
    status: int = 200
    message: str = "Token refreshed"
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    success: bool = True
    status: int = 200
    message: str = "If an account with that email exists, a reset link has been sent."


class UpdatePasswordRequest(BaseModel):
    new_password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)
