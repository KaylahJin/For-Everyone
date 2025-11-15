package com.bookstore.controller;

import com.bookstore.model.User;
import com.bookstore.service.UserService;
import com.bookstore.dto.LoginResponse;
import com.bookstore.dto.LogoutResponse;
import com.bookstore.dto.SignupResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3000") // 👈 change port if your frontend uses another
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // ✅ Signup endpoint with validation
    @PostMapping("/signup")
    public ResponseEntity<SignupResponse> signup(@Valid @RequestBody User user) {
        User savedUser = userService.signup(user);

        SignupResponse response = new SignupResponse(
                "Signup successful!",
                savedUser.getUsername(),
                savedUser.getEmail()
        );

        return ResponseEntity.ok(response);
    }

    // ✅ Login endpoint
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody User loginRequest) {
        Optional<User> user = userService.login(
                loginRequest.getEmail(),
                loginRequest.getPassword()
        );

        if (user.isPresent()) {
            User u = user.get();
            String role = u.getEmail().equalsIgnoreCase("admin@admin.com") ? "ADMIN" : "USER";

            LoginResponse response = new LoginResponse(
                    u.getId(),
                    "Login successful!",
                    u.getUsername(),
                    u.getEmail(),
                    role
            );
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401)
                    .body(new LoginResponse(null, "Invalid email or password", null, null, null));
        }
    }

    // Logout endpoint
    @PostMapping("/logout")
    public ResponseEntity<LogoutResponse> logout(@RequestBody(required = false) User logoutRequest) {
        Long userId = null;
        if (logoutRequest != null) {
            userId = logoutRequest.getId();
        }

        // เรียกใช้ service เพื่อทำการ logout
        boolean success = userService.logout(userId);

        if (success || userId == null) {
            // ถ้าไม่มี userId ก็ถือว่า logout สำเร็จ (frontend จะ clear localStorage เอง)
            LogoutResponse response = new LogoutResponse(
                    "Logout successful!",
                    true
            );
            return ResponseEntity.ok(response);
        } else {
            // ถ้า userId ไม่ถูกต้อง
            LogoutResponse response = new LogoutResponse(
                    "User not found",
                    false
            );
            return ResponseEntity.status(404).body(response);
        }
    }


    // ⚙️ Optional: Friendly error message for validation issues
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<String> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult()
                .getAllErrors()
                .get(0)
                .getDefaultMessage();
        return ResponseEntity.badRequest().body(errorMessage);
    }
}
