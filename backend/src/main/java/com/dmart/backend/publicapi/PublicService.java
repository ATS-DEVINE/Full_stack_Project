package com.dmart.backend.publicapi;

import com.dmart.backend.domain.AppRole;
import com.dmart.backend.domain.ProductStatus;
import com.dmart.backend.domain.SellerStatus;
import com.dmart.backend.model.Product;
import com.dmart.backend.model.UserAccount;
import com.dmart.backend.repo.CategoryRepository;
import com.dmart.backend.repo.ProductRepository;
import com.dmart.backend.repo.UserAccountRepository;
import com.dmart.backend.support.ApiMapper;
import com.dmart.backend.support.ApiViews;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PublicService {

  private final ProductRepository productRepository;
  private final UserAccountRepository userAccountRepository;
  private final CategoryRepository categoryRepository;
  private final ApiMapper apiMapper;

  public PublicService(
      ProductRepository productRepository,
      UserAccountRepository userAccountRepository,
      CategoryRepository categoryRepository,
      ApiMapper apiMapper
  ) {
    this.productRepository = productRepository;
    this.userAccountRepository = userAccountRepository;
    this.categoryRepository = categoryRepository;
    this.apiMapper = apiMapper;
  }

  public List<ApiViews.ProductView> getProducts() {
    return productRepository.findByStatusOrderByCreatedAtDesc(ProductStatus.ACTIVE).stream()
        .map(apiMapper::toProductView)
        .toList();
  }

  public ApiViews.ProductView getProduct(String id) {
    return productRepository.findById(id)
        .filter(product -> product.getStatus() == ProductStatus.ACTIVE)
        .map(apiMapper::toProductView)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));
  }

  public List<ApiViews.SellerView> getSellers() {
    List<Product> activeProducts = productRepository.findByStatusOrderByCreatedAtDesc(ProductStatus.ACTIVE);
    Map<String, List<Product>> productsBySeller = activeProducts.stream()
        .collect(Collectors.groupingBy(product -> product.getSeller().getId()));

    return userAccountRepository.findByRoleOrderByCreatedAtDesc(AppRole.SELLER).stream()
        .filter(seller -> seller.getSellerStatus() == SellerStatus.APPROVED)
        .map(seller -> apiMapper.toSellerView(
            seller,
            productsBySeller.getOrDefault(seller.getId(), List.of()).size(),
            apiMapper.distinctSortedCategories(productsBySeller.getOrDefault(seller.getId(), List.of()))
        ))
        .sorted(Comparator.comparing(ApiViews.SellerView::name))
        .toList();
  }

  public ApiViews.SellerView getSeller(String id) {
    UserAccount seller = userAccountRepository.findById(id)
        .filter(user -> user.getRole() == AppRole.SELLER && user.getSellerStatus() == SellerStatus.APPROVED)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Seller not found."));
    List<Product> products = productRepository.findBySellerIdOrderByCreatedAtDesc(id).stream()
        .filter(product -> product.getStatus() == ProductStatus.ACTIVE)
        .toList();
    return apiMapper.toSellerView(seller, products.size(), apiMapper.distinctSortedCategories(products));
  }

  public List<ApiViews.CategoryView> getCategories() {
    Map<String, Long> productCounts = productRepository.findByStatusOrderByCreatedAtDesc(ProductStatus.ACTIVE).stream()
        .map(Product::getCategory)
        .filter(java.util.Objects::nonNull)
        .collect(Collectors.groupingBy(com.dmart.backend.model.Category::getId, Collectors.counting()));

    return categoryRepository.findAll().stream()
        .sorted(Comparator.comparing(category -> category.getName().toLowerCase()))
        .map(category -> apiMapper.toCategoryView(category, productCounts.getOrDefault(category.getId(), 0L)))
        .toList();
  }
}
