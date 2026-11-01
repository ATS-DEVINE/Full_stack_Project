import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-foreground text-primary-foreground">
      <div className="container py-6 md:py-12">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-display text-xs font-bold text-primary-foreground">D</div>
              <span className="font-display text-base font-bold">Duniya Mart</span>
            </div>
            <p className="text-xs opacity-70">India's trusted B2B & B2C grocery marketplace.</p>
          </div>
          <div>
            <h4 className="mb-2 font-display text-xs font-semibold uppercase tracking-wider opacity-60">For Buyers</h4>
            <nav className="flex flex-col gap-1 text-xs opacity-80">
              <Link to="/products" className="hover:opacity-100">Browse Products</Link>
              <Link to="/sellers" className="hover:opacity-100">Find Sellers</Link>
              <Link to="/cart" className="hover:opacity-100">My Cart</Link>
            </nav>
          </div>
          <div>
            <h4 className="mb-2 font-display text-xs font-semibold uppercase tracking-wider opacity-60">For Sellers</h4>
            <nav className="flex flex-col gap-1 text-xs opacity-80">
              <Link to="/signup" className="hover:opacity-100">Become a Seller</Link>
              <Link to="/login" className="hover:opacity-100">Seller Login</Link>
            </nav>
          </div>
          <div className="hidden md:block">
            <h4 className="mb-2 font-display text-xs font-semibold uppercase tracking-wider opacity-60">Company</h4>
            <nav className="flex flex-col gap-1 text-xs opacity-80">
              <span>About Us</span>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Contact</span>
            </nav>
          </div>
        </div>
        <div className="mt-4 border-t border-primary-foreground/10 pt-4 text-center text-xs opacity-50">
          © 2026 Duniya Mart. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
