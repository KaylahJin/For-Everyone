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
    private final BookRepository bookRepo; // ✅ new dependency

    public OrderService(OrderRepository orderRepo, CartRepository cartRepo, BookRepository bookRepo) {
        this.orderRepo = orderRepo;
        this.cartRepo = cartRepo;
        this.bookRepo = bookRepo;
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
            Book book = ci.getBook();

            // 🧮 Check if stock is enough
            if (book.getStock() < ci.getQuantity()) {
                throw new IllegalStateException("Not enough stock for book: " + book.getTitle());
            }

            // 📉 Reduce stock
            book.setStock(book.getStock() - ci.getQuantity());
            bookRepo.save(book); // persist change

            // 🧾 Create OrderItem
            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setBook(book);
            oi.setQuantity(ci.getQuantity());
            oi.setPrice(book.getPrice());
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
}
