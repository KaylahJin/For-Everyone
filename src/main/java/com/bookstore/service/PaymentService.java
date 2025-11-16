package com.bookstore.service;
import java.util.List;

import com.bookstore.model.Order;
import com.bookstore.model.Payment;
import com.bookstore.repo.OrderRepository;
import com.bookstore.repo.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepo;
    private final OrderRepository orderRepo;

    public PaymentService(PaymentRepository paymentRepo, OrderRepository orderRepo) {
        this.paymentRepo = paymentRepo;
        this.orderRepo = orderRepo;
    }

    @Transactional
    public Payment create(Long orderId, String bankName, String accountNumber,
                          double amount, String date, String time, String slipFileName) {

        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        Payment p = new Payment();
        p.setOrderId(orderId);
        p.setBankName(bankName);
        p.setAccountNumber(accountNumber);
        p.setAmount(amount);
        p.setTransferDate(LocalDate.parse(date));   // "2025-10-16"
        p.setTransferTime(LocalTime.parse(time));   // "15:45"
        p.setSlipFileName(slipFileName);
        p.setStatus("RECEIVED");

        // ออปชัน: ถ้าต้องการ auto-PAID เมื่อยอดตรง
        if (Math.abs(amount - order.getTotal()) < 0.000001) {
            order.setStatus("PAID");
            orderRepo.save(order);
            p.setStatus("PAID");
        }

        return paymentRepo.save(p);
    }

    // ✅ Find payments by order ID
    public List<Payment> findByOrderId(Long orderId) {
        return paymentRepo.findByOrderId(orderId);
    }

}