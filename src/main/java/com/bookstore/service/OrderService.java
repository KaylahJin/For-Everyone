package com.bookstore.service;

import com.bookstore.model.*;
import com.bookstore.repo.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepo;
    private final CartRepository cartRepo;

    public OrderService(OrderRepository orderRepo, CartRepository cartRepo) {
        this.orderRepo = orderRepo;
        this.cartRepo = cartRepo;
    }

    // ✅ Create order from cart
    @Transactional
    public Order confirmOrder(Long userId) {
        List<CartItem> cartItems = cartRepo.findByUserId(userId);
        if (cartItems.isEmpty()) {
            throw new IllegalStateException("Cart is empty");
        }

        // ✅ Calculate subtotal
        double subTotal = cartItems.stream()
                .mapToDouble(ci -> ci.getBook().getPrice() * ci.getQuantity())
                .sum();

        // ✅ Automatically compute shipping + discount
        double shippingFee = subTotal > 0 ? 40 : 0;
        double discount = subTotal >= 300 ? 40 : 0;
        double total = subTotal + shippingFee - discount;

        // ✅ Build and save order
        Order order = new Order();
        order.setUserId(userId);
        order.setSubTotal(subTotal);
        order.setShippingFee(shippingFee);
        order.setDiscount(discount);
        order.setTotal(total);
        order.setStatus("PENDING_PAYMENT");

        for (CartItem ci : cartItems) {
            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setBook(ci.getBook());
            oi.setQuantity(ci.getQuantity());
            oi.setPrice(ci.getBook().getPrice()); // ✅ include price
            order.getItems().add(oi);
        }

        Order saved = orderRepo.save(order);
        cartRepo.deleteByUserId(userId); // ✅ Clear cart
        return saved;
    }

    // ✅ Update order (for address or status updates)
    public Order updateOrder(Order order) {
        return orderRepo.save(order);
    }

    // ✅ Get all orders for one user
    public List<Order> getOrdersForUser(Long userId) {
        return orderRepo.findByUserId(userId);
    }
    
    // ✅ Admin ใช้ดึง order ทั้งหมด
    public List<Order> getAllOrders() {
        return orderRepo.findAll();
    }

    // ✅ ใช้ดึง order ตาม id (เอาไว้เปลี่ยน status)
    public Order getOrder(Long orderId) {
        return orderRepo.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
    }
}