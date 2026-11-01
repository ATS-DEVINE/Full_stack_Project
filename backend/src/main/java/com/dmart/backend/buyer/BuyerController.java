package com.dmart.backend.buyer;

import com.dmart.backend.model.UserAccount;
import com.dmart.backend.support.ApiViews;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/buyer")
public class BuyerController {

  private final BuyerService buyerService;

  public BuyerController(BuyerService buyerService) {
    this.buyerService = buyerService;
  }

  @GetMapping("/dashboard")
  public ApiViews.BuyerDashboardView dashboard(@AuthenticationPrincipal UserAccount buyer) {
    return buyerService.dashboard(buyer);
  }

  @GetMapping("/addresses")
  public List<ApiViews.AddressView> addresses(@AuthenticationPrincipal UserAccount buyer) {
    return buyerService.getAddresses(buyer);
  }

  @PostMapping("/addresses")
  public ApiViews.AddressView addAddress(
      @AuthenticationPrincipal UserAccount buyer,
      @Valid @RequestBody BuyerDtos.AddressRequest request
  ) {
    return buyerService.addAddress(buyer, request);
  }

  @DeleteMapping("/addresses/{addressId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteAddress(@AuthenticationPrincipal UserAccount buyer, @PathVariable String addressId) {
    buyerService.deleteAddress(buyer, addressId);
  }

  @PatchMapping("/profile")
  public ApiViews.UserView updateProfile(
      @AuthenticationPrincipal UserAccount buyer,
      @RequestBody BuyerDtos.BuyerProfileRequest request
  ) {
    return buyerService.updateProfile(buyer, request);
  }

  @DeleteMapping("/favorites/{favoriteId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void removeFavorite(@AuthenticationPrincipal UserAccount buyer, @PathVariable String favoriteId) {
    buyerService.removeFavorite(buyer, favoriteId);
  }
}
