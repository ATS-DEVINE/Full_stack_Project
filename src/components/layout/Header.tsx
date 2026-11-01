import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categories } from "@/data/mockData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { totalItems } = useCart();
  const { user, profile, isAdmin, isSeller, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="bg-primary">
        <div className="container flex items-center justify-between py-1.5 text-xs text-primary-foreground">
          <span className="font-medium">🇮🇳 India's #1 B2B Grocery Marketplace</span>
          <div className="hidden gap-4 sm:flex">
            <Link to="/sellers" className="transition-opacity hover:opacity-80">Become a Seller</Link>
            <Link to="/login" className="transition-opacity hover:opacity-80">Help Center</Link>
          </div>
        </div>
      </div>

      <div className="container flex items-center gap-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">D</div>
          <div className="hidden sm:block">
            <span className="font-display text-xl font-bold text-foreground">Duniya</span>
            <span className="font-display text-xl font-bold text-secondary">Mart</span>
          </div>
        </Link>

        <form className="relative flex flex-1 items-center" onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`); }}>
          <select className="hidden h-10 rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-foreground focus:outline-none md:block">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <input
            type="text"
            placeholder="Search products, sellers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary md:rounded-l-none"
          />
          <button type="submit" className="absolute right-0 flex h-10 w-10 items-center justify-center rounded-r-lg bg-secondary text-secondary-foreground">
            <Search className="h-4 w-4" />
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-muted">
            <ShoppingCart className="h-5 w-5 text-foreground" />
            {totalItems > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary p-0 text-[10px] text-secondary-foreground">
                {totalItems}
              </Badge>
            )}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden gap-1.5 sm:flex">
                  <User className="h-4 w-4" />
                  {profile?.full_name || user.email?.split("@")[0]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAdmin && <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>Admin Dashboard</DropdownMenuItem>}
                {isSeller && <DropdownMenuItem onClick={() => navigate("/seller/dashboard")}>Seller Dashboard</DropdownMenuItem>}
                <DropdownMenuItem onClick={() => navigate("/buyer/dashboard")}>My Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm" className="hidden gap-1.5 sm:flex">
                  <User className="h-4 w-4" /> Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="hidden sm:flex">Sign Up</Button>
              </Link>
            </>
          )}

          <button className="flex h-10 w-10 items-center justify-center rounded-lg sm:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card p-4 sm:hidden">
          <nav className="flex flex-col gap-2">
            <Link to="/products" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted" onClick={() => setMobileOpen(false)}>All Products</Link>
            <Link to="/sellers" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted" onClick={() => setMobileOpen(false)}>Sellers</Link>
            {user ? (
              <>
                {isAdmin && <Link to="/admin/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted" onClick={() => setMobileOpen(false)}>Admin</Link>}
                <button className="rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-muted" onClick={() => { handleSignOut(); setMobileOpen(false); }}>Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted" onClick={() => setMobileOpen(false)}>Login</Link>
                <Link to="/signup" className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted" onClick={() => setMobileOpen(false)}>Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
