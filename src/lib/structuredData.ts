// Generate structured data (JSON-LD) for different content types

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "The Shopping Cart",
  "alternateName": "TheShoppingCart.shop",
  "url": "https://theshoppingcart.shop",
  "logo": "https://theshoppingcart.shop/logo.jpg",
  "description": "Pakistan's premier online store for home decor, wallets, furniture, accessories, and garden decorations. Quality products delivered across Pakistan.",
  "sameAs": [
    "https://facebook.com/theshoppingcart",
    "https://instagram.com/theshoppingcart"
  ]
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "The Shopping Cart",
  "url": "https://theshoppingcart.shop",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://theshoppingcart.shop/shop?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export const productSchema = (product: {
  name: string;
  description: string;
  price: number;
  images: string[];
  sku?: string;
  stock_quantity?: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": product.name,
  "description": product.description || product.name,
  "image": product.images.map(img => img.startsWith('http') ? img : `https://theshoppingcart.shop${img}`),
  "sku": product.sku || product.name,
  "brand": {
    "@type": "Brand",
    "name": "The Shopping Cart"
  },
  "offers": {
    "@type": "Offer",
    "url": typeof window !== 'undefined' ? window.location.href : '',
    "priceCurrency": "PKR",
    "price": product.price,
    "availability": product.stock_quantity && product.stock_quantity > 0 
      ? "https://schema.org/InStock" 
      : "https://schema.org/OutOfStock",
    "seller": {
      "@type": "Organization",
      "name": "The Shopping Cart"
    }
  }
});

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url.startsWith('http') ? item.url : `https://theshoppingcart.shop${item.url}`
  }))
});

export const blogPostSchema = (post: {
  title: string;
  excerpt: string;
  author: string;
  created_at: string;
  featured_image_url?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": post.title,
  "description": post.excerpt,
  "author": {
    "@type": "Person",
    "name": post.author
  },
  "publisher": {
    "@type": "Organization",
    "name": "The Shopping Cart",
    "logo": {
      "@type": "ImageObject",
      "url": "https://theshoppingcart.shop/logo.jpg"
    }
  },
  "datePublished": post.created_at,
  "image": post.featured_image_url 
    ? (post.featured_image_url.startsWith('http') ? post.featured_image_url : `https://theshoppingcart.shop${post.featured_image_url}`)
    : "https://theshoppingcart.shop/logo.jpg"
});
