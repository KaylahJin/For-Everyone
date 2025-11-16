package com.bookstore.dto;

import com.bookstore.model.OrderItem;

public class OrderItemResponse {
     private Long bookId;
    private String title;
    private String author;
    private String category;
    private double price;
    private int quantity;

    public static OrderItemResponse from(OrderItem item) {
        OrderItemResponse res = new OrderItemResponse();
        res.bookId = item.getBook().getId();
        res.title = item.getBook().getTitle();
        res.author = item.getBook().getAuthor();
        res.category = item.getBook().getCategory();
        res.quantity = item.getQuantity();
        return res;
    }

    // --- Getters ---
    public Long getBookId() { return bookId; }
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public String getCategory() { return category; }
    public double getPrice() { return price; }
    public int getQuantity() { return quantity; }
}
