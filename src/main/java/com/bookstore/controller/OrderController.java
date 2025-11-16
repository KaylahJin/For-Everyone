package com.bookstore.controller;

import com.bookstore.dto.OrderResponse;
import com.bookstore.model.Order;
import com.bookstore.repo.ShippingAddressRepository;
import com.bookstore.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final ShippingAddressRepository shippingAddressRepository;
    private final OrderService orderService;

    public OrderController(ShippingAddressRepository shippingAddressRepository,
                           OrderService orderService) {
        this.shippingAddressRepository = shippingAddressRepository;
        this.orderService = orderService;
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

    // ✅ Admin: get ALL orders
        // ✅ Admin: get ALL orders
        @GetMapping("/all")
        public List<OrderResponse> getAllOrders() {
            return orderService.getAllOrders()
                    .stream()
                    .map(OrderResponse::from)
                    .toList();
        }

        // ✅ Admin: update order status (PENDING_PAYMENT → COMPLETE / CANCELLED)
    @PutMapping("/{orderId}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> body) {

        String status = body.get("status");  // "COMPLETE" หรือ "CANCELLED"
        Order updated = orderService.updateOrderStatus(orderId, status);
        return ResponseEntity.ok(OrderResponse.from(updated));
    }

    // ✅  Get single order by orderId (ใช้ใน admin-checkout.html)
    @GetMapping("/order/{orderId}")
    public OrderResponse getOrderById(@PathVariable Long orderId) {
        Order order = orderService.getOrderById(orderId);
        return OrderResponse.from(order);
    }



}