package com.dmart.backend.seller;

import com.dmart.backend.domain.OrderStatus;
import com.dmart.backend.domain.ProductStatus;
import com.dmart.backend.domain.SellerStatus;
import com.dmart.backend.model.Category;
import com.dmart.backend.model.OrderRecord;
import com.dmart.backend.model.PricingTier;
import com.dmart.backend.model.Product;
import com.dmart.backend.model.UserAccount;
import com.dmart.backend.repo.CategoryRepository;
import com.dmart.backend.repo.OrderRecordRepository;
import com.dmart.backend.repo.ProductRepository;
import com.dmart.backend.repo.UserAccountRepository;
import com.dmart.backend.support.ApiMapper;
import com.dmart.backend.support.ApiViews;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SellerService {

  private final ProductRepository productRepository;
  private final OrderRecordRepository orderRecordRepository;
  private final CategoryRepository categoryRepository;
  private final UserAccountRepository userAccountRepository;
  private final ApiMapper apiMapper;

  public SellerService(
      ProductRepository productRepository,
      OrderRecordRepository orderRecordRepository,
      CategoryRepository categoryRepository,
      UserAccountRepository userAccountRepository,
      ApiMapper apiMapper
  ) {
    this.productRepository = productRepository;
    this.orderRecordRepository = orderRecordRepository;
    this.categoryRepository = categoryRepository;
    this.userAccountRepository = userAccountRepository;
    this.apiMapper = apiMapper;
  }

  public ApiViews.SellerDashboardView dashboard(UserAccount seller) {
    List<Product> products = productRepository.findBySellerIdOrderByCreatedAtDesc(seller.getId());
    List<OrderRecord> orders = orderRecordRepository.findBySellerIdOrderByCreatedAtDesc(seller.getId());
    List<ApiViews.CategoryView> categories = categoryRepository.findAll().stream()
        .sorted(Comparator.comparing(Category::getName))
        .map(category -> apiMapper.toCategoryView(category, products.stream()
            .filter(product -> product.getCategory() != null && category.getId().equals(product.getCategory().getId()))
            .count()))
        .toList();
    BigDecimal revenue = orders.stream()
        .map(OrderRecord::getTotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    LocalDate today = LocalDate.now();
    return new ApiViews.SellerDashboardView(
        apiMapper.toSellerView(seller, products.size(), apiMapper.distinctSortedCategories(products)),
        products.stream().map(apiMapper::toProductView).toList(),
        orders.stream().map(apiMapper::toOrderView).toList(),
        categories,
        new ApiViews.SellerStatsView(
            revenue,
            orders.stream().filter(order -> order.getCreatedAt().toLocalDate().equals(today)).count(),
            orders.stream().filter(order -> order.getStatus() == OrderStatus.PLACED).count(),
            products.size()
        )
    );
  }

  @Transactional
  public ApiViews.ProductView createProduct(UserAccount seller, SellerDtos.ProductRequest request) {
    Product product = new Product();
    applyProductRequest(product, seller, request);
    return apiMapper.toProductView(productRepository.save(product));
  }

  @Transactional
  public ApiViews.ProductView updateProduct(UserAccount seller, String productId, SellerDtos.ProductRequest request) {
    Product product = ownedProduct(seller, productId);
    applyProductRequest(product, seller, request);
    return apiMapper.toProductView(productRepository.save(product));
  }

  @Transactional
  public void deleteProduct(UserAccount seller, String productId) {
    Product product = ownedProduct(seller, productId);
    productRepository.delete(product);
  }

  @Transactional
  public ApiViews.OrderView updateOrderStatus(UserAccount seller, String orderId, String status) {
    OrderRecord order = ownedOrder(seller, orderId);
    try {
      order.setStatus(OrderStatus.valueOf(status.toUpperCase(Locale.ROOT)));
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order status is invalid.");
    }
    return apiMapper.toOrderView(orderRecordRepository.save(order));
  }

  @Transactional
  public ApiViews.OrderView saveTracking(UserAccount seller, String orderId, SellerDtos.TrackingRequest request) {
    OrderRecord order = ownedOrder(seller, orderId);
    order.setCourierName(request.courierName());
    order.setTrackingId(request.trackingId());
    order.setEstimatedDelivery(request.estimatedDelivery());
    order.setStatus(OrderStatus.SHIPPED);
    return apiMapper.toOrderView(orderRecordRepository.save(order));
  }

  @Transactional
  public ApiViews.SellerView updateStoreProfile(UserAccount seller, SellerDtos.SellerProfileRequest request) {
    if (request.businessName() != null) {
      seller.setBusinessName(request.businessName());
    }
    if (request.description() != null) {
      seller.setSellerDescription(request.description());
    }
    if (request.gstin() != null) {
      seller.setGstin(request.gstin());
    }
    if (request.address() != null) {
      seller.setAddress(request.address());
    }
    if (request.logoUrl() != null) {
      seller.setLogoUrl(request.logoUrl());
    }
    if (request.bannerUrl() != null) {
      seller.setBannerUrl(request.bannerUrl());
    }
    UserAccount saved = userAccountRepository.save(seller);
    List<Product> sellerProducts = productRepository.findBySellerIdOrderByCreatedAtDesc(saved.getId());
    return apiMapper.toSellerView(saved, sellerProducts.size(), apiMapper.distinctSortedCategories(sellerProducts));
  }

  private void applyProductRequest(Product product, UserAccount seller, SellerDtos.ProductRequest request) {
    product.setSeller(seller);
    product.setName(request.name());
    product.setDescription(request.description());
    product.setCategory(resolveCategory(request.categoryId()));
    product.setUnit(request.unit());
    product.setStockQuantity(Math.max(request.stockQuantity(), 0));
    product.setMinOrderQty(Math.max(request.minOrderQty(), 1));
    product.setBasePrice(request.basePrice());
    product.setDiscountPercent(request.discountPercent() == null ? 0 : Math.max(request.discountPercent(), 0));
    product.setStatus(parseProductStatus(request.status()));
    product.setImages(request.images());
    product.setPricingTiers(List.of(defaultTier(request.basePrice(), product.getMinOrderQty())));
  }

  private Category resolveCategory(String categoryId) {
    if (categoryId == null || categoryId.isBlank()) {
      return null;
    }
    return categoryRepository.findById(categoryId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found."));
  }

  private PricingTier defaultTier(BigDecimal basePrice, int minOrderQty) {
    PricingTier tier = new PricingTier();
    tier.setMinQty(minOrderQty);
    tier.setMaxQty(null);
    tier.setPricePerUnit(basePrice);
    return tier;
  }

  private ProductStatus parseProductStatus(String status) {
    try {
      return ProductStatus.valueOf(status.toUpperCase(Locale.ROOT));
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product status is invalid.");
    }
  }

  private Product ownedProduct(UserAccount seller, String productId) {
    return productRepository.findById(productId)
        .filter(product -> product.getSeller().getId().equals(seller.getId()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));
  }

  private OrderRecord ownedOrder(UserAccount seller, String orderId) {
    return orderRecordRepository.findById(orderId)
        .filter(order -> order.getSeller().getId().equals(seller.getId()))
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found."));
  }
}
