package com.bookstore.service;

import com.bookstore.model.CartItem;
import com.bookstore.model.Order;
import com.bookstore.model.OrderItem;
import com.bookstore.repo.CartRepository;
import com.bookstore.repo.OrderRepository;
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

    // ===========================
    // Create order from cart
    // ===========================
    @Transactional
    public Order confirmOrder(Long userId) {
        List<CartItem> cartItems = cartRepo.findByUserId(userId);
        if (cartItems.isEmpty()) {
            throw new IllegalStateException("Cart is empty");
        }

        double subTotal = cartItems.stream()
                .mapToDouble(ci -> ci.getBook().getPrice() * ci.getQuantity())
                .sum();

        double shippingFee = subTotal > 0 ? 40 : 0;
        double discount = subTotal >= 300 ? 40 : 0;
        double total = subTotal + shippingFee - discount;

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
            oi.setPrice(ci.getBook().getPrice());
            order.getItems().add(oi);
        }

        Order saved = orderRepo.save(order);
        cartRepo.deleteByUserId(userId);
        return saved;
    }

    // ===========================
    // Update whole order
    // ===========================
    public Order updateOrder(Order order) {
        return orderRepo.save(order);
    }

    // ===========================
    // For customer: view own orders
    // ===========================
    public List<Order> getOrdersForUser(Long userId) {
        return orderRepo.findByUserId(userId);
    }

    // ✅ Get single order by its ID (ใช้กับ admin-checkout)
    public Order getOrderById(Long orderId) {
        return orderRepo.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
    }


    // ===========================
    // ADMIN — GET ALL ORDERS
    // ===========================
    public List<Order> getAllOrders() {
        return orderRepo.findAll();
    }

    // ===========================
    // ADMIN — UPDATE ORDER STATUS
    // ===========================
    public Order updateOrderStatus(Long orderId, String status) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        order.setStatus(status);

        return orderRepo.save(order);
    }
}
