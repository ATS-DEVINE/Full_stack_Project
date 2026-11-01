package com.dmart.backend.seller;

import com.dmart.backend.model.UserAccount;
import com.dmart.backend.support.ApiViews;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seller")
public class SellerController {

  private final SellerService sellerService;

  public SellerController(SellerService sellerService) {
    this.sellerService = sellerService;
  }

  @GetMapping("/dashboard")
  public ApiViews.SellerDashboardView dashboard(@AuthenticationPrincipal UserAccount seller) {
    return sellerService.dashboard(seller);
  }

  @PostMapping("/products")
  public ApiViews.ProductView createProduct(
      @AuthenticationPrincipal UserAccount seller,
      @Valid @RequestBody SellerDtos.ProductRequest request
  ) {
    return sellerService.createProduct(seller, request);
  }

  @PutMapping("/products/{productId}")
  public ApiViews.ProductView updateProduct(
      @AuthenticationPrincipal UserAccount seller,
      @PathVariable String productId,
      @Valid @RequestBody SellerDtos.ProductRequest request
  ) {
    return sellerService.updateProduct(seller, productId, request);
  }

  @DeleteMapping("/products/{productId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteProduct(@AuthenticationPrincipal UserAccount seller, @PathVariable String productId) {
    sellerService.deleteProduct(seller, productId);
  }

  @PatchMapping("/orders/{orderId}/status")
  public ApiViews.OrderView updateOrderStatus(
      @AuthenticationPrincipal UserAccount seller,
      @PathVariable String orderId,
      @RequestParam String status
  ) {
    return sellerService.updateOrderStatus(seller, orderId, status);
  }

  @PatchMapping("/orders/{orderId}/tracking")
  public ApiViews.OrderView saveTracking(
      @AuthenticationPrincipal UserAccount seller,
      @PathVariable String orderId,
      @Valid @RequestBody SellerDtos.TrackingRequest request
  ) {
    return sellerService.saveTracking(seller, orderId, request);
  }

  @PatchMapping("/profile")
  public ApiViews.SellerView updateProfile(
      @AuthenticationPrincipal UserAccount seller,
      @RequestBody SellerDtos.SellerProfileRequest request
  ) {
    return sellerService.updateStoreProfile(seller, request);
  }
}
