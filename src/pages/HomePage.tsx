import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Timer, TrendingUp, Sparkles, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/marketplace/ProductCard";
import SellerCard from "@/components/marketplace/SellerCard";
import { heroBanners } from "@/data/mockData";
import { useProducts, useSellers, useCategories } from "@/hooks/useMarketplaceData";

function CountdownTimer() {
  const [time, setTime] = useState({ h: 5, m: 32, s: 18 });
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) return { h: 5, m: 32, s: 18 };
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    <div className="flex items-center gap-1">
      {[pad(time.h), pad(time.m), pad(time.s)].map((v, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="rounded bg-foreground px-1.5 py-0.5 font-display text-sm font-bold text-background">{v}</span>
          {i < 2 && <span className="font-bold text-foreground">:</span>}
        </span>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [bannerIndex, setBannerIndex] = useState(0);
  const [imageReady, setImageReady] = useState(true);
  const { data: products = [] } = useProducts();
  const { data: sellers = [] } = useSellers();
  const { data: categories = [] } = useCategories();

  const topProducts = products.slice(0, 6);
  const flashDeals = products.filter(p => p.discount > 0).slice(0, 4);
  const newArrivals = products.slice(6);

  useEffect(() => {
    heroBanners.forEach(b => {
      const img = new Image();
      img.src = b.bgImage;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (bannerIndex + 1) % heroBanners.length;
      const img = new Image();
      img.src = heroBanners[nextIndex].bgImage;
      const proceed = () => {
        setImageReady(true);
        setBannerIndex(nextIndex);
      };
      if (img.complete) {
        proceed();
      } else {
        setImageReady(false);
        img.onload = proceed;
        img.onerror = proceed;
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [bannerIndex]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={bannerIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative py-16 md:py-24"
            style={{
              backgroundImage: `url(${heroBanners[bannerIndex].bgImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-black/55" />
            <div className="container relative z-10 text-center text-primary-foreground">
              <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mb-4 font-display text-3xl font-extrabold leading-tight md:text-5xl">
                {heroBanners[bannerIndex].title}
              </motion.h1>
              <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="mb-6 text-lg opacity-90 md:text-xl">
                {heroBanners[bannerIndex].subtitle}
              </motion.p>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                <Link to="/products">
                  <Button size="lg" className="gap-2 bg-card text-foreground hover:bg-card/90">
                    {heroBanners[bannerIndex].cta} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {heroBanners.map((_, i) => (
            <button key={i} onClick={() => setBannerIndex(i)} className={`h-2 rounded-full transition-all ${i === bannerIndex ? "w-6 bg-primary-foreground" : "w-2 bg-primary-foreground/40"}`} />
          ))}
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-border bg-card">
        <div className="container flex flex-wrap items-center justify-center gap-6 py-4 text-sm text-muted-foreground md:justify-between md:gap-0">
          {[
            { icon: <Truck className="h-4 w-4 text-primary" />, text: "Pan-India Delivery" },
            { icon: <TrendingUp className="h-4 w-4 text-primary" />, text: "Wholesale Prices" },
            { icon: <Sparkles className="h-4 w-4 text-primary" />, text: "Verified Sellers" },
            { icon: <Timer className="h-4 w-4 text-primary" />, text: "MOQ-Based Pricing" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 font-medium">{item.icon} {item.text}</div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-10">
        <div className="container">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-foreground">Shop by Category</h2>
            <Link to="/products" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">View All <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6">
            {categories.slice(0, 12).map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/products?category=${cat.slug}`} className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:shadow-card-hover hover:border-primary/30">
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="text-center text-xs font-medium text-foreground">{cat.name}</span>
                  <span className="text-[10px] text-muted-foreground">{cat.productCount} items</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Deals */}
      {flashDeals.length > 0 && (
        <section className="bg-muted/50 py-10">
          <div className="container">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl font-bold text-foreground">⚡ Flash Deals</h2>
                <CountdownTimer />
              </div>
              <Link to="/products" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">See All Deals <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {flashDeals.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Top Products */}
      <section className="py-10">
        <div className="container">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-foreground">Top Selling Products</h2>
            <Link to="/products" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">View All <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {topProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Top Sellers */}
      <section className="bg-muted/50 py-10">
        <div className="container">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-foreground">Verified Suppliers</h2>
            <Link to="/sellers" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">View All <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {sellers.map(s => <SellerCard key={s.id} seller={s} />)}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-10">
          <div className="container">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-foreground">🆕 New Arrivals</h2>
              <Link to="/products" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">View All <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="bg-gradient-primary py-14">
        <div className="container text-center text-primary-foreground">
          <h2 className="mb-3 font-display text-2xl font-bold md:text-3xl">Start Selling on Duniya Mart</h2>
          <p className="mb-6 text-base opacity-90">Reach thousands of buyers across India. Join our verified seller network today.</p>
          <Link to="/signup">
            <Button size="lg" className="bg-card text-foreground hover:bg-card/90">Register as Seller</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
