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
}