package com.dmart.backend.checkout;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public final class CheckoutDtos {

  private CheckoutDtos() {
  }

  public record CouponPreview(String code, BigDecimal discount) {
  }

  public record OrderItemRequest(
      @NotBlank String productId,
      int quantity
  ) {
  }

  public record PlaceOrderRequest(
      @NotBlank String addressId,
      String couponCode,
      @NotEmpty List<@NotNull OrderItemRequest> items
  ) {
  }

  public record PlaceOrderResponse(int ordersCreated) {
  }
}
