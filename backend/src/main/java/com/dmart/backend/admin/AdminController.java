package com.dmart.backend.admin;

import com.dmart.backend.support.ApiViews;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

  private final AdminService adminService;

  public AdminController(AdminService adminService) {
    this.adminService = adminService;
  }

  @GetMapping("/dashboard")
  public ApiViews.AdminDashboardView dashboard() {
    return adminService.dashboard();
  }

  @PatchMapping("/sellers/{sellerId}/status")
  public ApiViews.SellerView updateSellerStatus(@PathVariable String sellerId, @RequestParam String status) {
    return adminService.updateSellerStatus(sellerId, status);
  }

  @DeleteMapping("/products/{productId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteProduct(@PathVariable String productId) {
    adminService.deleteProduct(productId);
  }

  @PostMapping("/coupons")
  public ApiViews.CouponView createCoupon(@Valid @RequestBody AdminDtos.CouponRequest request) {
    return adminService.createCoupon(request);
  }

  @PatchMapping("/coupons/{couponId}/toggle")
  public ApiViews.CouponView toggleCoupon(@PathVariable String couponId) {
    return adminService.toggleCoupon(couponId);
  }

  @PostMapping("/categories")
  public ApiViews.CategoryView createCategory(@Valid @RequestBody AdminDtos.CategoryRequest request) {
    return adminService.createCategory(request);
  }

  @DeleteMapping("/categories/{categoryId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteCategory(@PathVariable String categoryId) {
    adminService.deleteCategory(categoryId);
  }
}
