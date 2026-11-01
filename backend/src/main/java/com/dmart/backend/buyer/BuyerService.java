package com.dmart.backend.buyer;

import com.dmart.backend.model.Address;
import com.dmart.backend.model.Favorite;
import com.dmart.backend.model.UserAccount;
import com.dmart.backend.repo.AddressRepository;
import com.dmart.backend.repo.FavoriteRepository;
import com.dmart.backend.repo.OrderRecordRepository;
import com.dmart.backend.repo.UserAccountRepository;
import com.dmart.backend.support.ApiMapper;
import com.dmart.backend.support.ApiViews;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BuyerService {

  private final OrderRecordRepository orderRecordRepository;
  private final FavoriteRepository favoriteRepository;
  private final AddressRepository addressRepository;
  private final UserAccountRepository userAccountRepository;
  private final ApiMapper apiMapper;

  public BuyerService(
      OrderRecordRepository orderRecordRepository,
      FavoriteRepository favoriteRepository,
      AddressRepository addressRepository,
      UserAccountRepository userAccountRepository,
      ApiMapper apiMapper
  ) {
    this.orderRecordRepository = orderRecordRepository;
    this.favoriteRepository = favoriteRepository;
    this.addressRepository = addressRepository;
    this.userAccountRepository = userAccountRepository;
    this.apiMapper = apiMapper;
  }

  public ApiViews.BuyerDashboardView dashboard(UserAccount buyer) {
    return new ApiViews.BuyerDashboardView(
        orderRecordRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId()).stream().map(apiMapper::toOrderView).toList(),
        favoriteRepository.findByUserId(buyer.getId()).stream().map(apiMapper::toFavoriteView).toList(),
        getAddresses(buyer)
    );
  }

  public List<ApiViews.AddressView> getAddresses(UserAccount buyer) {
    return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(buyer.getId()).stream()
        .map(apiMapper::toAddressView)
        .toList();
  }

  @Transactional
  public ApiViews.AddressView addAddress(UserAccount buyer, BuyerDtos.AddressRequest request) {
    if (request.isDefault()) {
      addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(buyer.getId())
          .forEach(existing -> existing.setDefault(false));
    }

    Address address = new Address();
    address.setUser(buyer);
    address.setLabel(request.label());
    address.setFullName(request.fullName());
    address.setPhone(request.phone());
    address.setAddressLine1(request.addressLine1());
    address.setAddressLine2(request.addressLine2());
    address.setCity(request.city());
    address.setState(request.state());
    address.setPincode(request.pincode());
    address.setDefault(request.isDefault());
    return apiMapper.toAddressView(addressRepository.save(address));
  }

  @Transactional
  public void deleteAddress(UserAccount buyer, String addressId) {
    Address address = addressRepository.findById(addressId)
        .filter(item -> item.getUser().getId().equals(buyer.getId()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found."));
    addressRepository.delete(address);
  }

  @Transactional
  public ApiViews.UserView updateProfile(UserAccount buyer, BuyerDtos.BuyerProfileRequest request) {
    if (request.fullName() != null) {
      buyer.setFullName(request.fullName());
    }
    if (request.phone() != null) {
      buyer.setPhone(request.phone());
    }
    if (request.avatarUrl() != null) {
      buyer.setAvatarUrl(request.avatarUrl());
    }
    return apiMapper.toUserView(userAccountRepository.save(buyer));
  }

  @Transactional
  public void removeFavorite(UserAccount buyer, String favoriteId) {
    Favorite favorite = favoriteRepository.findById(favoriteId)
        .filter(item -> item.getUser().getId().equals(buyer.getId()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wishlist item not found."));
    favoriteRepository.delete(favorite);
  }
}
