package com.dmart.backend.checkout;

import com.dmart.backend.domain.OrderStatus;
import com.dmart.backend.model.Address;
import com.dmart.backend.model.Coupon;
import com.dmart.backend.model.OrderItem;
import com.dmart.backend.model.OrderRecord;
import com.dmart.backend.model.PricingTier;
import com.dmart.backend.model.Product;
import com.dmart.backend.model.UserAccount;
import com.dmart.backend.repo.AddressRepository;
import com.dmart.backend.repo.CouponRepository;
import com.dmart.backend.repo.OrderRecordRepository;
import com.dmart.backend.repo.ProductRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CheckoutService {

  private final AddressRepository addressRepository;
  private final CouponRepository couponRepository;
  private final OrderRecordRepository orderRecordRepository;
  private final ProductRepository productRepository;

  public CheckoutService(
      AddressRepository addressRepository,
      CouponRepository couponRepository,
      OrderRecordRepository orderRecordRepository,
      ProductRepository productRepository
  ) {
    this.addressRepository = addressRepository;
    this.couponRepository = couponRepository;
    this.orderRecordRepository = orderRecordRepository;
    this.productRepository = productRepository;
  }

  public CheckoutDtos.CouponPreview previewCoupon(String code, BigDecimal total) {
    Coupon coupon = validateCoupon(code, total);
    return new CheckoutDtos.CouponPreview(coupon.getCode(), calculateCouponDiscount(coupon, total));
  }

  @Transactional
  public CheckoutDtos.PlaceOrderResponse placeOrder(UserAccount buyer, CheckoutDtos.PlaceOrderRequest request) {
    Address address = addressRepository.findById(request.addressId())
        .filter(item -> item.getUser().getId().equals(buyer.getId()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please select a valid address."));
    if (request.items().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your cart is empty.");
    }

    List<LineItem> lineItems = request.items().stream()
        .map(item -> toLineItem(item.productId(), item.quantity()))
        .toList();
    BigDecimal cartTotal = lineItems.stream()
        .map(LineItem::lineTotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    Coupon coupon = null;
    BigDecimal totalDiscount = BigDecimal.ZERO;
    if (request.couponCode() != null && !request.couponCode().isBlank()) {
      coupon = validateCoupon(request.couponCode(), cartTotal);
      totalDiscount = calculateCouponDiscount(coupon, cartTotal);
    }

    Map<String, List<LineItem>> itemsBySeller = new LinkedHashMap<>();
    for (LineItem lineItem : lineItems) {
      itemsBySeller.computeIfAbsent(lineItem.product().getSeller().getId(), ignored -> new ArrayList<>()).add(lineItem);
    }

    int processed = 0;
    BigDecimal distributedDiscount = BigDecimal.ZERO;
    for (List<LineItem> sellerItems : itemsBySeller.values()) {
      BigDecimal subtotal = sellerItems.stream().map(LineItem::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
      BigDecimal orderDiscount;
      if (processed == itemsBySeller.size() - 1) {
        orderDiscount = totalDiscount.subtract(distributedDiscount);
      } else if (cartTotal.compareTo(BigDecimal.ZERO) == 0) {
        orderDiscount = BigDecimal.ZERO;
      } else {
        orderDiscount = totalDiscount.multiply(subtotal)
            .divide(cartTotal, 2, RoundingMode.HALF_UP);
        distributedDiscount = distributedDiscount.add(orderDiscount);
      }

      OrderRecord order = new OrderRecord();
      order.setBuyer(buyer);
      order.setSeller(sellerItems.getFirst().product().getSeller());
      order.setAddress(address);
      order.setSubtotal(subtotal);
      order.setDiscount(orderDiscount);
      order.setTotal(subtotal.subtract(orderDiscount));
      order.setCouponCode(coupon == null ? null : coupon.getCode());
      order.setStatus(OrderStatus.PLACED);
      order.setCreatedAt(LocalDateTime.now());
      sellerItems.forEach(item -> order.addItem(item.toOrderItem()));
      orderRecordRepository.save(order);
      processed++;
    }

    if (coupon != null) {
      coupon.setUsedCount((coupon.getUsedCount() == null ? 0 : coupon.getUsedCount()) + 1);
      couponRepository.save(coupon);
    }

    return new CheckoutDtos.PlaceOrderResponse(itemsBySeller.size());
  }

  private Coupon validateCoupon(String code, BigDecimal total) {
    Coupon coupon = couponRepository.findByCodeIgnoreCase(code)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid coupon."));
    if (!coupon.isActive()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon is inactive.");
    }
    if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(LocalDateTime.now())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon has expired.");
    }
    if (coupon.getMaxUses() != null && coupon.getUsedCount() != null && coupon.getUsedCount() >= coupon.getMaxUses()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon has reached its usage limit.");
    }
    if (coupon.getMinOrderValue() != null && total.compareTo(coupon.getMinOrderValue()) < 0) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Minimum order value for this coupon is INR " + coupon.getMinOrderValue().setScale(0, RoundingMode.HALF_UP)
      );
    }
    return coupon;
  }

  private BigDecimal calculateCouponDiscount(Coupon coupon, BigDecimal total) {
    BigDecimal discount = switch (coupon.getDiscountType()) {
      case PERCENTAGE -> total.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
      case FLAT -> coupon.getDiscountValue();
    };
    return discount.min(total);
  }

  private LineItem toLineItem(String productId, int quantity) {
    if (quantity <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be at least 1.");
    }
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));
    BigDecimal tierPrice = resolveTierPrice(product, quantity);
    BigDecimal linePrice = applyProductDiscount(tierPrice, product);
    return new LineItem(product, quantity, linePrice, linePrice.multiply(BigDecimal.valueOf(quantity)));
  }

  private BigDecimal resolveTierPrice(Product product, int quantity) {
    return product.getPricingTiers().stream()
        .sorted(java.util.Comparator.comparingInt(PricingTier::getMinQty))
        .filter(tier -> quantity >= tier.getMinQty() && (tier.getMaxQty() == null || quantity <= tier.getMaxQty()))
        .map(PricingTier::getPricePerUnit)
        .findFirst()
        .orElse(product.getBasePrice());
  }

  private BigDecimal applyProductDiscount(BigDecimal price, Product product) {
    Integer discountPercent = product.getDiscountPercent();
    if (discountPercent == null || discountPercent <= 0) {
      return price;
    }
    return price.multiply(BigDecimal.valueOf(100 - discountPercent))
        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
  }

  private record LineItem(Product product, int quantity, BigDecimal unitPrice, BigDecimal lineTotal) {
    private OrderItem toOrderItem() {
      OrderItem item = new OrderItem();
      item.setProduct(product);
      item.setQuantity(quantity);
      item.setUnitPrice(unitPrice);
      item.setTotalPrice(lineTotal);
      return item;
    }
  }
}
