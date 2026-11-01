package com.dmart.backend.config;

import com.dmart.backend.domain.AppRole;
import com.dmart.backend.domain.DiscountType;
import com.dmart.backend.domain.OrderStatus;
import com.dmart.backend.domain.ProductStatus;
import com.dmart.backend.domain.SellerStatus;
import com.dmart.backend.model.Address;
import com.dmart.backend.model.Category;
import com.dmart.backend.model.Coupon;
import com.dmart.backend.model.Favorite;
import com.dmart.backend.model.OrderItem;
import com.dmart.backend.model.OrderRecord;
import com.dmart.backend.model.PricingTier;
import com.dmart.backend.model.Product;
import com.dmart.backend.model.UserAccount;
import com.dmart.backend.repo.AddressRepository;
import com.dmart.backend.repo.CategoryRepository;
import com.dmart.backend.repo.CouponRepository;
import com.dmart.backend.repo.FavoriteRepository;
import com.dmart.backend.repo.OrderRecordRepository;
import com.dmart.backend.repo.ProductRepository;
import com.dmart.backend.repo.UserAccountRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SeedDataInitializer implements CommandLineRunner {

  private final UserAccountRepository userAccountRepository;
  private final CategoryRepository categoryRepository;
  private final ProductRepository productRepository;
  private final CouponRepository couponRepository;
  private final AddressRepository addressRepository;
  private final OrderRecordRepository orderRecordRepository;
  private final FavoriteRepository favoriteRepository;
  private final PasswordEncoder passwordEncoder;

  public SeedDataInitializer(
      UserAccountRepository userAccountRepository,
      CategoryRepository categoryRepository,
      ProductRepository productRepository,
      CouponRepository couponRepository,
      AddressRepository addressRepository,
      OrderRecordRepository orderRecordRepository,
      FavoriteRepository favoriteRepository,
      PasswordEncoder passwordEncoder
  ) {
    this.userAccountRepository = userAccountRepository;
    this.categoryRepository = categoryRepository;
    this.productRepository = productRepository;
    this.couponRepository = couponRepository;
    this.addressRepository = addressRepository;
    this.orderRecordRepository = orderRecordRepository;
    this.favoriteRepository = favoriteRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  @Transactional
  public void run(String... args) {
    ensureAdmin();
    if (productRepository.count() > 0) {
      return;
    }

    Category vegetables = saveCategory("cat-vegetables", "Vegetables", "vegetables", "Veg");
    Category spices = saveCategory("cat-spices", "Spices", "spices", "Spice");
    Category dairy = saveCategory("cat-dairy", "Dairy", "dairy", "Dairy");
    Category grains = saveCategory("cat-grains", "Grains & Cereals", "grains", "Grain");
    Category beverages = saveCategory("cat-beverages", "Beverages", "beverages", "Tea");
    Category oils = saveCategory("cat-oils", "Oils & Ghee", "oils", "Oil");

    UserAccount buyer = saveUser("buyer", "buyer@duniyamart.com", "Buyer@123456", "Wholesale Buyer", AppRole.BUYER);

    UserAccount sellerFresh = saveSeller(
        "seller-fresh", "fresh@duniyamart.com", "Seller@123456", "Fresh Farm Organics",
        SellerStatus.APPROVED, true, "Organic produce straight from Maharashtra farms.", "Pune, Maharashtra"
    );
    UserAccount sellerSpice = saveSeller(
        "seller-spice", "spice@duniyamart.com", "Seller@123456", "Spice Kingdom",
        SellerStatus.APPROVED, true, "Premium spices sourced directly from Kerala growers.", "Kochi, Kerala"
    );
    UserAccount sellerTea = saveSeller(
        "seller-tea", "chai@duniyamart.com", "Seller@123456", "Chai & More",
        SellerStatus.PENDING, false, "Assam teas and beverage staples for cafes and retailers.", "Guwahati, Assam"
    );

    Product tomatoes = saveProduct(
        "prod-tomatoes",
        sellerFresh,
        vegetables,
        "Organic Red Tomatoes",
        "Fresh vine-ripened organic tomatoes ideal for wholesale kitchens and retailers.",
        List.of("/images/products/tomatoes.jpg"),
        "kg",
        500,
        1,
        new BigDecimal("65.00"),
        10,
        ProductStatus.ACTIVE,
        tiers(new int[][] {{1, 10, 65}, {11, 50, 55}, {51, -1, 45}})
    );
    Product capsicum = saveProduct(
        "prod-capsicum",
        sellerFresh,
        vegetables,
        "Fresh Green Capsicum",
        "Crisp shimla mirch for restaurants and kirana stores.",
        List.of("/images/products/capsicum.jpg"),
        "kg",
        320,
        1,
        new BigDecimal("80.00"),
        15,
        ProductStatus.ACTIVE,
        tiers(new int[][] {{1, 10, 80}, {11, 50, 68}, {51, -1, 58}})
    );
    Product cardamom = saveProduct(
        "prod-cardamom",
        sellerSpice,
        spices,
        "Kerala Cardamom",
        "Premium green cardamom with rich aroma and strong flavor.",
        List.of("/images/products/cardamom.jpg"),
        "kg",
        200,
        1,
        new BigDecimal("2400.00"),
        0,
        ProductStatus.ACTIVE,
        tiers(new int[][] {{1, 5, 2400}, {6, 20, 2100}, {21, -1, 1850}})
    );
    Product chilli = saveProduct(
        "prod-chilli",
        sellerSpice,
        spices,
        "Kashmiri Red Chilli Powder",
        "Deep red chilli powder with vibrant color and mild heat.",
        List.of("/images/products/kashmiri-chilli.jpg"),
        "kg",
        380,
        1,
        new BigDecimal("450.00"),
        5,
        ProductStatus.ACTIVE,
        tiers(new int[][] {{1, 5, 450}, {6, 25, 390}, {26, -1, 340}})
    );
    Product paneer = saveProduct(
        "prod-paneer",
        sellerFresh,
        dairy,
        "Farm Fresh Paneer",
        "Soft paneer made from fresh buffalo milk for daily wholesale demand.",
        List.of("/images/products/paneer.jpg"),
        "kg",
        150,
        1,
        new BigDecimal("340.00"),
        5,
        ProductStatus.ACTIVE,
        tiers(new int[][] {{1, 5, 340}, {6, 20, 310}, {21, -1, 280}})
    );
    Product oil = saveProduct(
        "prod-mustard-oil",
        sellerTea,
        oils,
        "Cold-Pressed Mustard Oil",
        "Pure mustard oil available in wholesale packs.",
        List.of("/images/products/mustard-oil.jpg"),
        "litre",
        600,
        1,
        new BigDecimal("195.00"),
        0,
        ProductStatus.DRAFT,
        tiers(new int[][] {{1, 10, 195}, {11, 50, 175}, {51, -1, 160}})
    );

    Coupon welcome = new Coupon();
    welcome.setId("coupon-welcome20");
    welcome.setCode("WELCOME20");
    welcome.setDescription("Flat 20 percent off for new bulk buyers.");
    welcome.setDiscountType(DiscountType.PERCENTAGE);
    welcome.setDiscountValue(new BigDecimal("20.00"));
    welcome.setMinOrderValue(new BigDecimal("500.00"));
    welcome.setMaxUses(100);
    welcome.setUsedCount(0);
    welcome.setExpiresAt(LocalDateTime.now().plusMonths(3));
    welcome.setActive(true);
    couponRepository.save(welcome);

    Coupon save100 = new Coupon();
    save100.setId("coupon-save100");
    save100.setCode("SAVE100");
    save100.setDescription("INR 100 off orders above INR 1000.");
    save100.setDiscountType(DiscountType.FLAT);
    save100.setDiscountValue(new BigDecimal("100.00"));
    save100.setMinOrderValue(new BigDecimal("1000.00"));
    save100.setMaxUses(100);
    save100.setUsedCount(3);
    save100.setExpiresAt(LocalDateTime.now().plusMonths(2));
    save100.setActive(true);
    couponRepository.save(save100);

    Address address = new Address();
    address.setId("addr-buyer-home");
    address.setUser(buyer);
    address.setLabel("Warehouse");
    address.setFullName("Wholesale Buyer");
    address.setPhone("9999999999");
    address.setAddressLine1("42 Market Street");
    address.setAddressLine2("Near Central Yard");
    address.setCity("Pune");
    address.setState("Maharashtra");
    address.setPincode("411001");
    address.setDefault(true);
    addressRepository.save(address);

    OrderRecord order = new OrderRecord();
    order.setId("order-001");
    order.setBuyer(buyer);
    order.setSeller(sellerSpice);
    order.setAddress(address);
    order.setSubtotal(new BigDecimal("1560.00"));
    order.setDiscount(new BigDecimal("100.00"));
    order.setTotal(new BigDecimal("1460.00"));
    order.setCouponCode("SAVE100");
    order.setStatus(OrderStatus.SHIPPED);
    order.setCourierName("BlueDart");
    order.setTrackingId("BD123456789");
    order.setEstimatedDelivery(LocalDate.now().plusDays(2));
    order.setCreatedAt(LocalDateTime.now().minusDays(1));
    order.addItem(orderItem("item-001", cardamom, 1, new BigDecimal("2400.00"), new BigDecimal("2400.00")));
    order.addItem(orderItem("item-002", chilli, 2, new BigDecimal("390.00"), new BigDecimal("780.00")));
    order.setSubtotal(new BigDecimal("3180.00"));
    order.setDiscount(new BigDecimal("100.00"));
    order.setTotal(new BigDecimal("3080.00"));
    orderRecordRepository.save(order);

    Favorite favorite = new Favorite();
    favorite.setId("favorite-cardamom");
    favorite.setUser(buyer);
    favorite.setProduct(cardamom);
    favoriteRepository.save(favorite);

    Favorite secondFavorite = new Favorite();
    secondFavorite.setId("favorite-tomatoes");
    secondFavorite.setUser(buyer);
    secondFavorite.setProduct(tomatoes);
    favoriteRepository.save(secondFavorite);
  }

  private void ensureAdmin() {
    userAccountRepository.findByEmailIgnoreCase("admin@duniyamart.com")
        .orElseGet(() -> saveUser("admin", "admin@duniyamart.com", "Admin@123456", "Admin", AppRole.ADMIN));
  }

  private UserAccount saveUser(String id, String email, String rawPassword, String fullName, AppRole role) {
    UserAccount user = new UserAccount();
    user.setId(id);
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(rawPassword));
    user.setFullName(fullName);
    user.setRole(role);
    user.setVerified(role != AppRole.SELLER);
    return userAccountRepository.save(user);
  }

  private UserAccount saveSeller(
      String id,
      String email,
      String rawPassword,
      String businessName,
      SellerStatus status,
      boolean verified,
      String description,
      String address
  ) {
    UserAccount seller = saveUser(id, email, rawPassword, businessName, AppRole.SELLER);
    seller.setBusinessName(businessName);
    seller.setSellerStatus(status);
    seller.setVerified(verified);
    seller.setSellerDescription(description);
    seller.setAddress(address);
    seller.setLogoUrl("/images/sellers/" + id + ".png");
    return userAccountRepository.save(seller);
  }

  private Category saveCategory(String id, String name, String slug, String icon) {
    Category category = new Category();
    category.setId(id);
    category.setName(name);
    category.setSlug(slug);
    category.setIcon(icon);
    return categoryRepository.save(category);
  }

  private Product saveProduct(
      String id,
      UserAccount seller,
      Category category,
      String name,
      String description,
      List<String> images,
      String unit,
      int stock,
      int moq,
      BigDecimal basePrice,
      int discountPercent,
      ProductStatus status,
      List<PricingTier> tiers
  ) {
    Product product = new Product();
    product.setId(id);
    product.setSeller(seller);
    product.setCategory(category);
    product.setName(name);
    product.setDescription(description);
    product.setImages(images);
    product.setUnit(unit);
    product.setStockQuantity(stock);
    product.setMinOrderQty(moq);
    product.setBasePrice(basePrice);
    product.setDiscountPercent(discountPercent);
    product.setStatus(status);
    product.setRating(new BigDecimal("4.7"));
    product.setReviewCount(120);
    product.setPricingTiers(tiers);
    return productRepository.save(product);
  }

  private List<PricingTier> tiers(int[][] matrix) {
    return java.util.Arrays.stream(matrix)
        .map(values -> {
          PricingTier tier = new PricingTier();
          tier.setMinQty(values[0]);
          tier.setMaxQty(values[1] < 0 ? null : values[1]);
          tier.setPricePerUnit(BigDecimal.valueOf(values[2]));
          return tier;
        })
        .toList();
  }

  private OrderItem orderItem(String id, Product product, int quantity, BigDecimal unitPrice, BigDecimal totalPrice) {
    OrderItem item = new OrderItem();
    item.setId(id);
    item.setProduct(product);
    item.setQuantity(quantity);
    item.setUnitPrice(unitPrice);
    item.setTotalPrice(totalPrice);
    return item;
  }
}
