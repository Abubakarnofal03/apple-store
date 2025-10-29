import { Link } from "react-router-dom";
import { Facebook, Instagram } from "lucide-react";
import logo from "@/assets/logo.jpg";

export const Footer = () => {
  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="glass border-t py-12">
      <div className="container mx-auto px-4">
        {/* SEO-rich footer text */}
        <div className="text-center mb-8 max-w-3xl mx-auto">
<p className="text-sm text-muted-foreground">
  <strong>techspotuae.store</strong> is your trusted destination in the UAE for brand-new and pre-owned 
  <strong> iPhones</strong>, <strong> iPads</strong>, <strong> MacBooks</strong>, and other premium Apple devices. 
  Get unbeatable prices, verified quality, and fast delivery across the UAE — all from a store that values performance and authenticity.
</p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src={logo} alt="Tech Spot UAE - Online Shopping in UAE" className="h-16 w-auto mb-4" />
            <p className="text-sm mb-4">Premium lifestyle products for the discerning customer.</p>
            {/* <div className="flex space-x-4">
              <a href="https://www.facebook.com/share/1EgybenFiL/" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors" aria-label="Visit our Facebook page">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/theshoppingcart.official?igsh=MTMzbGd3ZXhvMHFvbA==" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors" aria-label="Visit our Instagram page">
                <Instagram className="h-5 w-5" />
              </a>
            </div> */}
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" onClick={handleLinkClick} className="hover:text-accent transition-colors">Shop All Products</Link></li>
              {/* <li><Link to="/blog" onClick={handleLinkClick} className="hover:text-accent transition-colors">Blog</Link></li> */}
              {/* <li><Link to="/about" onClick={handleLinkClick} className="hover:text-accent transition-colors">About Us</Link></li> */}
              <li><Link to="/contact" onClick={handleLinkClick} className="hover:text-accent transition-colors">Contact</Link></li>
            </ul>
          </div>
          {/* <div>
            <h4 className="font-semibold mb-4">Shop by Category</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop?category=home-decor" onClick={handleLinkClick} className="hover:text-accent transition-colors">Home Decor</Link></li>
              <li><Link to="/shop?category=furniture" onClick={handleLinkClick} className="hover:text-accent transition-colors">Furniture</Link></li>
              <li><Link to="/shop?category=mens-wallets" onClick={handleLinkClick} className="hover:text-accent transition-colors">Men's Wallets</Link></li>
              <li><Link to="/shop?category=womens-wallets" onClick={handleLinkClick} className="hover:text-accent transition-colors">Women's Wallets</Link></li>
              <li><Link to="/shop?category=accessories" onClick={handleLinkClick} className="hover:text-accent transition-colors">Accessories</Link></li>
              <li><Link to="/shop?category=garden-decorations" onClick={handleLinkClick} className="hover:text-accent transition-colors">Garden Decorations</Link></li>
            </ul>
          </div> */}
          <div>
            <h4 className="font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" onClick={handleLinkClick} className="hover:text-accent transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2025 Tech Spot UAE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};