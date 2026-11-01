package com.dmart.backend.buyer;

import jakarta.validation.constraints.NotBlank;

public final class BuyerDtos {

  private BuyerDtos() {
  }

  public record AddressRequest(
      @NotBlank String label,
      @NotBlank String fullName,
      @NotBlank String phone,
      @NotBlank String addressLine1,
      String addressLine2,
      @NotBlank String city,
      @NotBlank String state,
      @NotBlank String pincode,
      boolean isDefault
  ) {
  }

  public record BuyerProfileRequest(
      String fullName,
      String phone,
      String avatarUrl
  ) {
  }
}
