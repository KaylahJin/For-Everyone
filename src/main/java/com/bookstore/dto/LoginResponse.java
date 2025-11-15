package com.bookstore.dto;

public class LoginResponse {
    private Long id;       // add this 👈
    private String message;
    private String username;
    private String email;
    private String role;

    public LoginResponse(Long id, String message, String username, String email, String role) {
        this.id = id;
        this.message = message;
        this.username = username;
        this.email = email;
        this.role = role;
    }

    public Long getId() { return id; }
    public String getMessage() { return message; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
}