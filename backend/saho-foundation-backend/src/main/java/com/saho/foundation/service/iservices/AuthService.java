package com.saho.foundation.service.iservices;

import com.saho.foundation.dto.LoginRequestDto;
import com.saho.foundation.dto.LoginResponseDto;

public interface AuthService {
    LoginResponseDto adminLogin(LoginRequestDto request);
    LoginResponseDto studentLogin(LoginRequestDto request);
}
