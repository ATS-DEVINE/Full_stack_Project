package com.dmart.backend.seller;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class SellerDtos {

  private SellerDtos() {
  }

  public record ProductRequest(
      @NotBlank String name,
      String description,
      String categoryId,
      @NotBlank String unit,
      int stockQuantity,
      int minOrderQty,
      @NotNull BigDecimal basePrice,
      Integer discountPercent,
      @NotBlank String status,
      List<String> images
  ) {
  }

  public record TrackingRequest(
      @NotBlank String courierName,
      @NotBlank String trackingId,
      LocalDate estimatedDelivery
  ) {
  }

  public record SellerProfileRequest(
      String businessName,
      String description,
      String gstin,
      String address,
      String logoUrl,
      String bannerUrl
  ) {
  }
}
