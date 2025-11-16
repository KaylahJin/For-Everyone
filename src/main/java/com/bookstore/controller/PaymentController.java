package com.bookstore.controller;
import java.util.List;
import com.bookstore.dto.OrderItemResponse;
import com.bookstore.dto.ShippingAddressResponse;
import com.bookstore.model.Order;
import com.bookstore.model.Payment;
import com.bookstore.model.ShippingAddress;
import com.bookstore.repo.OrderRepository;
import com.bookstore.repo.ShippingAddressRepository;
import com.bookstore.service.PaymentService;
import com.bookstore.storage.FileStorageService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.bookstore.dto.PaymentInfoResponse;
import com.bookstore.dto.OrderFinalResponse;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService service;
    private final FileStorageService storageService;

    // ✅ เพิ่ม repo 2 ตัวนี้เพื่อดึง Order + Address มาประกอบ summary
    private final OrderRepository orderRepository;
    private final ShippingAddressRepository shippingAddressRepository;

    public PaymentController(PaymentService service,
                             FileStorageService storageService,
                             OrderRepository orderRepository,
                             ShippingAddressRepository shippingAddressRepository) {
        this.service = service;
        this.storageService = storageService;
        this.orderRepository = orderRepository;
        this.shippingAddressRepository = shippingAddressRepository;
    }

    // ✅ เดิม: รับข้อมูลแบบ query/form-data (ไม่มีสลิป)
    @PostMapping
    public ResponseEntity<Payment> create(
            @RequestParam Long orderId,
            @RequestParam String bankName,
            @RequestParam String accountNumber,
            @RequestParam double amount,
            @RequestParam String transferDate, // "yyyy-MM-dd"
            @RequestParam String transferTime, // "HH:mm"
            @RequestParam(required = false) String slipFileName) {

        Payment saved = service.create(orderId, bankName, accountNumber, amount,
                transferDate, transferTime, slipFileName);
        return ResponseEntity.ok(saved);
    }

    // ✅ เดิม: อัปโหลดสลิป (multipart/form-data) -> ส่งกลับเฉพาะข้อมูลสลิป
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createWithUpload(
            @RequestParam Long orderId,
            @RequestParam String bankName,
            @RequestParam String accountNumber,
            @RequestParam double amount,
            @RequestParam String transferDate, // yyyy-MM-dd
            @RequestParam String transferTime, // HH:mm
            @RequestPart("file") MultipartFile file
    ) {
        try {
            String storedFileName = storageService.saveFile(file);
            String publicUrl = "/uploads/" + storedFileName;

            Payment saved = service.create(orderId, bankName, accountNumber,
                    amount, transferDate, transferTime, storedFileName);

            return ResponseEntity.ok(new PaymentUploadResponse(
                    saved.getId(),
                    storedFileName,
                    publicUrl
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("❌ Upload failed: " + e.getMessage());
        }
    }

    // ✅ ใหม่: อัปโหลดสลิป แล้ว "ส่งสรุปทั้งชุด" (Order + Address + Items + Payment)
    @PostMapping(value = "/upload/summary", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createWithUploadAndSummary(
            @RequestParam Long orderId,
            @RequestParam String bankName,
            @RequestParam String accountNumber,
            @RequestParam double amount,
            @RequestParam String transferDate, // yyyy-MM-dd
            @RequestParam String transferTime, // HH:mm
            @RequestPart("file") MultipartFile file
    ) {
        try {
            // 1) เซฟสลิป
            String storedFileName = storageService.saveFile(file);
            String slipUrl = "/uploads/" + storedFileName;

            // 2) สร้าง payment
            Payment saved = service.create(orderId, bankName, accountNumber,
                    amount, transferDate, transferTime, storedFileName);

            // 3) ดึง order + ที่อยู่
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found"));

            ShippingAddress address = null;
            if (order.getShippingAddressId() != null) {
                address = shippingAddressRepository.findById(order.getShippingAddressId()).orElse(null);
            }

            // 4) ประกอบสรุป
            OrderFinalResponse res = new OrderFinalResponse();
            res.id = order.getId();
            res.userId = order.getUserId();
            res.orderDate = order.getOrderDate() != null ? order.getOrderDate().toString() : null;
            res.subTotal = order.getSubTotal();
            res.shippingFee = order.getShippingFee();
            res.discount = order.getDiscount();
            res.total = order.getTotal();
            res.status = order.getStatus();

            res.items = order.getItems().stream()
                    .map(OrderItemResponse::from)
                    .collect(Collectors.toList());

            res.shippingAddress = (address != null) ? ShippingAddressResponse.from(address) : null;

            res.payment = new PaymentInfoResponse(
                    saved.getId(),
                    saved.getAmount(),
                    saved.getBankName(),
                    saved.getAccountNumber(),
                    saved.getStatus(),
                    saved.getTransferDate() != null ? saved.getTransferDate().toString() : null,
                    saved.getTransferTime() != null ? saved.getTransferTime().toString() : null,
                    slipUrl
            );

            // 5) ส่งสรุป
            return ResponseEntity.ok(res);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("❌ Upload failed: " + e.getMessage());
        }
    }

    // ✅ DTO สำหรับ response หลังอัปโหลดสลิป (ตัวเดิม)
    static class PaymentUploadResponse {
        public Long paymentId;
        public String fileName;
        public String url;
        public PaymentUploadResponse(Long paymentId, String fileName, String url) {
            this.paymentId = paymentId;
            this.fileName = fileName;
            this.url = url;
        }
    }

    // ✅ Get payments by order ID (for admin to view slip)
    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<Payment>> getPaymentsByOrderId(@PathVariable Long orderId) {
        List<Payment> payments = service.findByOrderId(orderId);
        return ResponseEntity.ok(payments);
    }
}


