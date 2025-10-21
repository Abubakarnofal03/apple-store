// Generate structured data (JSON-LD) for different content types

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "tech spot uae",
  "alternateName": "techspotuae.store",
  "url": "https://techspotuae.store",
  "logo": "https://techspotuae.store/logo.jpg",
  "description": "UAE's premier online store for home decor, wallets, furniture, accessories, and garden decorations. Quality products delivered across UAE.",
  "sameAs": [
    "https://facebook.com/techspotuae",
    "https://instagram.com/techspotuae"
  ]
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "tech spot uae",
  "url": "https://techspotuae.store",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://techspotuae.store/shop?search={search_term_string}",
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
  "image": product.images.map(img => img.startsWith('http') ? img : `https://techspotuae.store${img}`),
  "sku": product.sku || product.name,
  "brand": {
    "@type": "Brand",
    "name": "tech spot uae"
  },
  "offers": {
    "@type": "Offer",
    "url": typeof window !== 'undefined' ? window.location.href : '',
  "priceCurrency": "AED",
    "price": product.price,
    "availability": product.stock_quantity && product.stock_quantity > 0 
      ? "https://schema.org/InStock" 
      : "https://schema.org/OutOfStock",
    "seller": {
      "@type": "Organization",
      "name": "tech spot uae"
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
    "item": item.url.startsWith('http') ? item.url : `https://techspotuae.store${item.url}`
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
    "name": "tech spot uae",
    "logo": {
      "@type": "ImageObject",
      "url": "https://techspotuae.store/logo.jpg"
    }
  },
  "datePublished": post.created_at,
  "image": post.featured_image_url 
    ? (post.featured_image_url.startsWith('http') ? post.featured_image_url : `https://techspotuae.store${post.featured_image_url}`)
    : "https://techspotuae.store/logo.jpg"
});
