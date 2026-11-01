package com.dmart.backend.admin;

import com.dmart.backend.domain.AppRole;
import com.dmart.backend.domain.DiscountType;
import com.dmart.backend.domain.ProductStatus;
import com.dmart.backend.domain.SellerStatus;
import com.dmart.backend.model.Category;
import com.dmart.backend.model.Coupon;
import com.dmart.backend.model.Product;
import com.dmart.backend.model.UserAccount;
import com.dmart.backend.repo.CategoryRepository;
import com.dmart.backend.repo.CouponRepository;
import com.dmart.backend.repo.OrderRecordRepository;
import com.dmart.backend.repo.ProductRepository;
import com.dmart.backend.repo.UserAccountRepository;
import com.dmart.backend.support.ApiMapper;
import com.dmart.backend.support.ApiViews;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminService {

  private final UserAccountRepository userAccountRepository;
  private final ProductRepository productRepository;
  private final OrderRecordRepository orderRecordRepository;
  private final CouponRepository couponRepository;
  private final CategoryRepository categoryRepository;
  private final ApiMapper apiMapper;

  public AdminService(
      UserAccountRepository userAccountRepository,
      ProductRepository productRepository,
      OrderRecordRepository orderRecordRepository,
      CouponRepository couponRepository,
      CategoryRepository categoryRepository,
      ApiMapper apiMapper
  ) {
    this.userAccountRepository = userAccountRepository;
    this.productRepository = productRepository;
    this.orderRecordRepository = orderRecordRepository;
    this.couponRepository = couponRepository;
    this.categoryRepository = categoryRepository;
    this.apiMapper = apiMapper;
  }

  public ApiViews.AdminDashboardView dashboard() {
    List<UserAccount> sellers = userAccountRepository.findByRoleOrderByCreatedAtDesc(AppRole.SELLER);
    List<UserAccount> buyers = userAccountRepository.findByRoleOrderByCreatedAtDesc(AppRole.BUYER);
    List<Product> products = productRepository.findAllByOrderByCreatedAtDesc();
    Map<String, List<Product>> productsBySeller = products.stream()
        .collect(Collectors.groupingBy(product -> product.getSeller().getId()));
    Map<String, Long> productsByCategory = products.stream()
        .map(Product::getCategory)
        .filter(Objects::nonNull)
        .collect(Collectors.groupingBy(Category::getId, Collectors.counting()));

    BigDecimal revenue = orderRecordRepository.findAllByOrderByCreatedAtDesc().stream()
        .map(order -> order.getTotal() == null ? BigDecimal.ZERO : order.getTotal())
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    return new ApiViews.AdminDashboardView(
        new ApiViews.AdminStatsView(
            buyers.size(),
            sellers.size(),
            products.size(),
            orderRecordRepository.count(),
            revenue
        ),
        sellers.stream()
            .map(seller -> apiMapper.toSellerView(
                seller,
                productsBySeller.getOrDefault(seller.getId(), List.of()).size(),
                apiMapper.distinctSortedCategories(productsBySeller.getOrDefault(seller.getId(), List.of()))
            ))
            .toList(),
        buyers.stream().map(apiMapper::toUserView).toList(),
        products.stream().map(apiMapper::toProductView).toList(),
        couponRepository.findAll().stream()
            .sorted(Comparator.comparing(Coupon::getCode))
            .map(apiMapper::toCouponView)
            .toList(),
        categoryRepository.findAll().stream()
            .sorted(Comparator.comparing(Category::getName))
            .map(category -> apiMapper.toCategoryView(category, productsByCategory.getOrDefault(category.getId(), 0L)))
            .toList()
    );
  }

  @Transactional
  public ApiViews.SellerView updateSellerStatus(String sellerId, String status) {
    UserAccount seller = userAccountRepository.findById(sellerId)
        .filter(user -> user.getRole() == AppRole.SELLER)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Seller not found."));
    SellerStatus sellerStatus;
    try {
      sellerStatus = SellerStatus.valueOf(status.toUpperCase(Locale.ROOT));
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seller status is invalid.");
    }
    seller.setSellerStatus(sellerStatus);
    seller.setVerified(sellerStatus == SellerStatus.APPROVED);
    UserAccount saved = userAccountRepository.save(seller);
    List<Product> sellerProducts = productRepository.findBySellerIdOrderByCreatedAtDesc(saved.getId());
    return apiMapper.toSellerView(saved, sellerProducts.size(), apiMapper.distinctSortedCategories(sellerProducts));
  }

  @Transactional
  public void deleteProduct(String productId) {
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));
    productRepository.delete(product);
  }

  @Transactional
  public ApiViews.CouponView createCoupon(AdminDtos.CouponRequest request) {
    Coupon coupon = new Coupon();
    coupon.setCode(request.code());
    coupon.setDescription(request.description());
    coupon.setDiscountType(parseDiscountType(request.discountType()));
    coupon.setDiscountValue(request.discountValue());
    coupon.setMinOrderValue(request.minOrderValue());
    coupon.setMaxUses(request.maxUses());
    coupon.setExpiresAt(request.expiresAt());
    coupon.setActive(true);
    coupon.setUsedCount(0);
    return apiMapper.toCouponView(couponRepository.save(coupon));
  }

  @Transactional
  public ApiViews.CouponView toggleCoupon(String couponId) {
    Coupon coupon = couponRepository.findById(couponId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon not found."));
    coupon.setActive(!coupon.isActive());
    return apiMapper.toCouponView(couponRepository.save(coupon));
  }

  @Transactional
  public ApiViews.CategoryView createCategory(AdminDtos.CategoryRequest request) {
    Category category = new Category();
    category.setName(request.name());
    category.setSlug(request.slug() == null || request.slug().isBlank() ? apiMapper.slugify(request.name()) : request.slug());
    category.setIcon(request.icon());
    Category saved = categoryRepository.save(category);
    return apiMapper.toCategoryView(saved, 0);
  }

  @Transactional
  public void deleteCategory(String categoryId) {
    Category category = categoryRepository.findById(categoryId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found."));
    productRepository.findAllByOrderByCreatedAtDesc().stream()
        .filter(product -> product.getCategory() != null && categoryId.equals(product.getCategory().getId()))
        .forEach(product -> product.setCategory(null));
    categoryRepository.delete(category);
  }

  private DiscountType parseDiscountType(String value) {
    try {
      return DiscountType.valueOf(value.toUpperCase(Locale.ROOT));
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Discount type must be percentage or flat.");
    }
  }
}
