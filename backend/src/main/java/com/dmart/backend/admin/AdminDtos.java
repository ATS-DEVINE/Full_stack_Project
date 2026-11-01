package com.dmart.backend.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class AdminDtos {

  private AdminDtos() {
  }

  public record CouponRequest(
      @NotBlank String code,
      String description,
      @NotBlank String discountType,
      @NotNull BigDecimal discountValue,
      BigDecimal minOrderValue,
      Integer maxUses,
      LocalDateTime expiresAt
  ) {
  }

  public record CategoryRequest(
      @NotBlank String name,
      String slug,
      String icon
  ) {
  }
}
