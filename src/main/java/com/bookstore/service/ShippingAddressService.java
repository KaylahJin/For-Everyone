package com.bookstore.service;

import com.bookstore.dto.ShippingAddressRequest;
import com.bookstore.model.ShippingAddress;
import com.bookstore.model.User;
import com.bookstore.repo.ShippingAddressRepository;
import com.bookstore.repo.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ShippingAddressService {

    private final ShippingAddressRepository repo;
    private final UserRepository userRepo;

    public ShippingAddressService(ShippingAddressRepository repo, UserRepository userRepo) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    @Transactional
    public ShippingAddress create(ShippingAddressRequest req) {
        User u = userRepo.findById(req.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("user not found"));

        ShippingAddress e = new ShippingAddress();
        e.setUser(u);
        copy(req, e);
        return repo.save(e);
    }

    @Transactional(readOnly = true)
    public List<ShippingAddress> listByUser(Long userId) {
    return repo.findByUser_Id(userId);   // ✅ ชื่อ match กับ repository แล้ว
    }

    @Transactional(readOnly = true)
    public ShippingAddress get(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("address not found"));
    }

    @Transactional
    public ShippingAddress update(Long id, ShippingAddressRequest req) {
        ShippingAddress e = get(id);
        if (!e.getUser().getId().equals(req.getUserId())) {
            throw new IllegalArgumentException("address does not belong to user");
        }
        copy(req, e);
        return repo.save(e);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        ShippingAddress e = get(id);
        if (!e.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("address does not belong to user");
        }
        repo.delete(e);
    }

    private void copy(ShippingAddressRequest req, ShippingAddress e) {
        e.setName(req.getName());
        e.setSurname(req.getSurname());
        e.setTelephone(req.getTelephone());
        e.setAddress1(req.getAddress1());
        e.setAddress2(req.getAddress2());
        e.setProvince(req.getProvince());
        e.setDistrict(req.getDistrict());
        e.setPostcode(req.getPostcode());
    }
}