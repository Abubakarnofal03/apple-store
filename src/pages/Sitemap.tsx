import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export default function Sitemap() {
  const { data: products } = useQuery({
    queryKey: ['sitemap-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('slug, updated_at');
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['sitemap-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('slug');
      if (error) throw error;
      return data;
    },
  });

  const { data: blogs } = useQuery({
    queryKey: ['sitemap-blogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('slug, updated_at')
        .eq('published', true);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (products && categories && blogs) {
      const baseUrl = 'https://techspotuae.store';
      
      const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Home Page -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Shop Page -->
  <url>
    <loc>${baseUrl}/shop</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- Category Pages -->
  ${categories.map(cat => `
  <url>
    <loc>${baseUrl}/shop?category=${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  
  <!-- Product Pages -->
  ${products.map(product => `
  <url>
    <loc>${baseUrl}/product/${product.slug}</loc>
    <lastmod>${new Date(product.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  
  <!-- Blog Pages -->
  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  ${blogs.map(blog => `
  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
    <lastmod>${new Date(blog.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
  
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

      // Set the content type and download
      const blob = new Blob([sitemapContent], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sitemap.xml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }, [products, categories, blogs]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Generating Sitemap...</h1>
        <p className="text-muted-foreground">
          Your sitemap.xml file will be downloaded automatically.
        </p>
      </div>
    </div>
  );
}
