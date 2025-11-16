package com.bookstore.controller;

import com.bookstore.dto.OrderResponse;
import com.bookstore.model.Order;
import com.bookstore.repo.ShippingAddressRepository;
import com.bookstore.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.bookstore.dto.AdminOrderSummaryResponse;
import com.bookstore.model.User;
import com.bookstore.repo.UserRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final ShippingAddressRepository shippingAddressRepository;
    private final OrderService orderService;
    private final UserRepository userRepository;

    public OrderController(ShippingAddressRepository shippingAddressRepository,
                           OrderService orderService,
                           UserRepository userRepository) {
        this.shippingAddressRepository = shippingAddressRepository;
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    // ✅ Checkout: create order from cart
    @PostMapping("/checkout/{userId}")
    public ResponseEntity<?> checkout(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> body) {

        Long addressId = ((Number) body.get("addressId")).longValue();

        // ✅ ตรวจสอบว่า addressId เป็นของ userId เดียวกัน
        var addr = shippingAddressRepository.findById(addressId)
                .orElseThrow(() -> new IllegalArgumentException("❌ Address not found"));
        if (!addr.getUser().getId().equals(userId)) {
            return ResponseEntity.badRequest().body("❌ Address not yours");
        }

        // ✅ Confirm and create order
        Order saved = orderService.confirmOrder(userId);

        // ✅ Set shipping address then update DB
        saved.setShippingAddressId(addressId);
        orderService.updateOrder(saved);

        // ✅ Send back summary
        return ResponseEntity.ok(OrderResponse.from(saved));
    }

    // ✅ Get all orders for a specific user
    @GetMapping("/{userId}")
    public List<OrderResponse> getOrders(@PathVariable Long userId) {
        return orderService.getOrdersForUser(userId)
                .stream()
                .map(OrderResponse::from)
                .toList();
    }
    
    // ✅ Admin: ดึงลิสต์ order ทั้งหมดสำหรับหน้า Checking Order & Slip
    @GetMapping("/admin/list")
    public List<AdminOrderSummaryResponse> getAdminOrderList() {
        return orderService.getAllOrders().stream()
                .map(order -> {
                    User user = userRepository.findById(order.getUserId()).orElse(null);
                    return AdminOrderSummaryResponse.from(order, user);
                })
                .toList();
    }
    
    // ✅ Admin: อัปเดตสถานะ order
    // body ตัวอย่าง: { "status": "PAID" } หรือ { "status": "CANCELLED" }
    @PostMapping("/{orderId}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long orderId,
            @RequestParam String status) {

        Order order = orderService.getOrder(orderId);
        order.setStatus(status);
        orderService.updateOrder(order);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long orderId) {
        Order order = orderService.getOrder(orderId);
        return ResponseEntity.ok(OrderResponse.from(order));
    }
}