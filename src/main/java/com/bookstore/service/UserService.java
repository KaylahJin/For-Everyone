package com.bookstore.service;

import com.bookstore.model.User;
import com.bookstore.repo.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ✅ Save user during signup
    public User signup(User user) {
        return userRepository.save(user);
    }

    // ✅ Login: supports both hardcoded admin and normal users
    public Optional<User> login(String email, String password) {
        // 👑 Hardcoded admin login
        if (email.equalsIgnoreCase("admin@admin.com") && password.equals("bookstore")) {
            User admin = new User();
            admin.setId(0L); // placeholder ID (not stored in DB)
            admin.setUsername("Admin");
            admin.setEmail(email);
            admin.setPassword(password);
            return Optional.of(admin);
        }

        // 👤 Normal user login
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent() && user.get().getPassword().equals(password)) {
            return user;
        }

        return Optional.empty(); // fail
    }

    // ✅ Logout: invalidate user session/token
    // ในอนาคตสามารถเพิ่ม token blacklisting หรือ session invalidation ได้ที่นี่
    public boolean logout(Long userId) {
        // ตรวจสอบว่า user มีอยู่จริงหรือไม่ (optional)
        if (userId != null) {
            Optional<User> user = userRepository.findById(userId);
            if (user.isPresent()) {
                // ในอนาคตสามารถเพิ่ม logic สำหรับ:
                // - ลบ JWT token จาก blacklist
                // - ลบ session จาก database
                // - อัปเดต last logout time
                return true;
            }
        }
        return false;
    }
}
