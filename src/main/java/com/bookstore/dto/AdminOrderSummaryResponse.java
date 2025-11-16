package com.bookstore.dto;

import com.bookstore.model.Order;
import com.bookstore.model.OrderItem;
import com.bookstore.model.User;

import java.time.format.DateTimeFormatter;

public class AdminOrderSummaryResponse {

    private Long orderId;
    private String username;
    private String book;
    private String time;   // HH:mm:ss
    private String date;   // dd/MM/yyyy
    private int amount;
    private double price;
    private String status; // PENDING_PAYMENT / PAID / CANCELLED

    // แปลงจาก Order + User → DTO สำหรับหน้า Admin
    public static AdminOrderSummaryResponse from(Order order, User user) {
        AdminOrderSummaryResponse res = new AdminOrderSummaryResponse();

        res.orderId = order.getId();
        res.username = (user != null) ? user.getUsername() : "Unknown";

        // ดึงชื่อหนังสือ + จำนวนเล่ม
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            OrderItem first = order.getItems().get(0);
            res.book = first.getBook().getTitle();
            res.amount = order.getItems().stream()
                    .mapToInt(OrderItem::getQuantity)
                    .sum();
        } else {
            res.book = "-";
            res.amount = 0;
        }

        // แปลงเวลา/วันที่ให้ตรงกับ UI
        if (order.getOrderDate() != null) {
            DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm:ss");
            DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            res.time = order.getOrderDate().toLocalTime().format(timeFmt);
            res.date = order.getOrderDate().toLocalDate().format(dateFmt);
        }

        // ราคา + status
        res.price = order.getTotal();
        res.status = order.getStatus();

        return res;
    }

    // --- Getters ---
    public Long getOrderId() { return orderId; }
    public String getUsername() { return username; }
    public String getBook() { return book; }
    public String getTime() { return time; }
    public String getDate() { return date; }
    public int getAmount() { return amount; }
    public double getPrice() { return price; }
    public String getStatus() { return status; }
}