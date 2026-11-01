package com.dmart.backend.publicapi;

import com.dmart.backend.support.ApiViews;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicController {

  private final PublicService publicService;

  public PublicController(PublicService publicService) {
    this.publicService = publicService;
  }

  @GetMapping("/products")
  public List<ApiViews.ProductView> products() {
    return publicService.getProducts();
  }

  @GetMapping("/products/{id}")
  public ApiViews.ProductView product(@PathVariable String id) {
    return publicService.getProduct(id);
  }

  @GetMapping("/sellers")
  public List<ApiViews.SellerView> sellers() {
    return publicService.getSellers();
  }

  @GetMapping("/sellers/{id}")
  public ApiViews.SellerView seller(@PathVariable String id) {
    return publicService.getSeller(id);
  }

  @GetMapping("/categories")
  public List<ApiViews.CategoryView> categories() {
    return publicService.getCategories();
  }
}
