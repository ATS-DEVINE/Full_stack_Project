package com.dmart.backend.checkout;

import com.dmart.backend.model.UserAccount;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

  private final CheckoutService checkoutService;

  public CheckoutController(CheckoutService checkoutService) {
    this.checkoutService = checkoutService;
  }

  @GetMapping("/coupons/{code}")
  public CheckoutDtos.CouponPreview previewCoupon(@PathVariable String code, @RequestParam BigDecimal total) {
    return checkoutService.previewCoupon(code, total);
  }

  @PostMapping("/orders")
  public CheckoutDtos.PlaceOrderResponse placeOrder(
      @AuthenticationPrincipal UserAccount buyer,
      @Valid @RequestBody CheckoutDtos.PlaceOrderRequest request
  ) {
    return checkoutService.placeOrder(buyer, request);
  }
}
