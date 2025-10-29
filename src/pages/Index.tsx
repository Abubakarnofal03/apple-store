import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Truck, CreditCard, Award, CheckCircle2, Star, Smartphone, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { calculateSalePrice } from "@/lib/saleUtils";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { organizationSchema, websiteSchema, breadcrumbSchema } from "@/lib/structuredData";

const Index = () => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const { data: banners } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Auto-rotate banners every 5 seconds
  useEffect(() => {
    if (!banners || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners]);

  const { data: featuredProducts } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('is_featured', true)
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['home-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const { data: sales } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('is_active', true)
        .gt('end_date', new Date().toISOString());
      if (error) throw error;
      return data;
    },
  });

  const activeBanner = banners?.[currentBannerIndex];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [organizationSchema, websiteSchema]
  };

  return (
    <>
      <SEOHead
        title="Tech Spot UAE – Buy Authentic Pre-Owned iPhones Online in UAE"
        description="Buy authentic pre-owned iPhones in original condition, never refurbished. 5000+ happy customers. Free 2-day delivery in UAE. Cash on delivery available. Store warranty included at techspotuae.store"
        keywords={[
          'buy iphone online UAE',
          'pre-owned iphone UAE',
          'authentic iphone',
          'never refurbished',
          'iphone store UAE',
          'used iphone in original condition',
          'buy online UAE',
          'tech spot UAE',
          'techspotuae.store',
          'cash on delivery iphone',
          'cheap iphone UAE',
          'original iphone'
        ]}
        canonicalUrl="https://techspotuae.store/"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
      
      <main className="flex-1">
        {/* Trust Banner */}
        <section className="bg-gradient-to-r from-green-600 via-green-700 to-green-600 text-white py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-black text-base">4.9/5 Rating</span>
              </div>
              <div className="hidden md:block border-l border-green-400/50 pl-6">
                <p className="text-sm font-bold">1,247+ Happy Customers</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-semibold">Trusted iPhone Store in UAE</span>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Hero Banner */}
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
          {banners && banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${
                index === currentBannerIndex
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-105'
              }`}
              style={{ backgroundImage: `url(${banner.image_url})` }}
            >
              <div className="absolute inset-0 bg-primary/40" />
            </div>
          ))}
          
          {activeBanner && activeBanner.show_text_overlay && (
            <div 
              key={currentBannerIndex}
              className="relative z-10 text-center text-white px-4 transition-all duration-700 ease-in-out"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-full border border-blue-200 dark:border-blue-800 mb-6">
                <Smartphone className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                <p className="text-sm font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">iPHONE STORE</p>
              </div>
              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black mb-6 drop-shadow-2xl animate-fade-in">
                {activeBanner.title || "Authentic Pre-Owned iPhones"}
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto drop-shadow-lg animate-fade-in">
                {activeBanner.subtitle || "Never Refurbished • Original Condition • Store Warranty"}
              </p>
              <div className="animate-fade-in space-x-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-black via-gray-900 to-black hover:from-gray-900 hover:via-gray-800 hover:to-gray-900 text-white font-black h-16 px-8 text-lg rounded-2xl shadow-2xl hover:shadow-3xl">
                  <Link to={activeBanner.link_url || '/shop'}>
                    Shop Now <ArrowRight className="ml-2 h-6 w-6" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
          
          {/* Navigation Dots */}
          {banners && banners.length > 1 && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`h-3 rounded-full transition-all duration-300 ${
                    index === currentBannerIndex
                      ? 'bg-accent w-8'
                      : 'bg-white/50 hover:bg-white/75 w-3'
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* Introduction Section for SEO */}
        {/* <section className="py-12 bg-background">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            {/* <p className="text-lg text-muted-foreground leading-relaxed">
              Welcome to <strong>Tech Spot UAE</strong> – your trusted online destination for premium <strong>home decor</strong>, 
              elegant <strong>wallets</strong>, stylish <strong>furniture</strong>, quality <strong>accessories</strong>, and beautiful 
              <strong> garden decorations</strong> in UAE. Shop with confidence and enjoy fast delivery across the country. 
              TheShoppingCart.shop brings you carefully curated products that blend style, quality, and affordability.
            </p> 
          </div>
        </section> */}

        {/* Shop by Category - Dynamic */}
        <section className="py-20 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-full border border-blue-200 dark:border-blue-800 mb-4">
                <Smartphone className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                <p className="text-sm font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">iPHONE COLLECTIONS</p>
              </div>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-br from-black to-gray-800 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                Browse All iPhone Models
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto text-base md:text-lg">
                Pre-owned in original condition, never refurbished. Quality guaranteed with store warranty.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories?.map((category) => (
                <Link 
                  key={category.id} 
                  to={`/shop?category=${category.slug}`} 
                  className="group"
                >
                  <Card className="glass-card glass-hover overflow-hidden rounded-xl">
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {category.image_url && (
                        <img 
                          src={category.image_url} 
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className="absolute inset-0 bg-primary/40 group-hover:bg-primary/60 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <h3 className="font-display text-3xl md:text-4xl font-bold text-white text-center px-4">
                          {category.name}
                        </h3>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Badges with Shadow Cards */}
        <section className="py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white dark:bg-gray-900 hover:shadow-xl transition-shadow rounded-2xl border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4 w-fit mb-4">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Never Refurbished</h3>
                  <p className="text-sm text-muted-foreground">Original condition, genuine parts only</p>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-gray-900 hover:shadow-xl transition-shadow rounded-2xl border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-4 w-fit mb-4">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Store Warranty</h3>
                  <p className="text-sm text-muted-foreground">7-day testing warranty included</p>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-gray-900 hover:shadow-xl transition-shadow rounded-2xl border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-4 w-fit mb-4">
                    <Truck className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Free Delivery</h3>
                  <p className="text-sm text-muted-foreground">2-day delivery across UAE</p>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-gray-900 hover:shadow-xl transition-shadow rounded-2xl border-2 border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-4 w-fit mb-4">
                    <CreditCard className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">COD Available</h3>
                  <p className="text-sm text-muted-foreground">Check before you pay</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Collection - Dynamic */}
        <section className="py-20 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-full border border-blue-200 dark:border-blue-800 mb-4">
                <Star className="h-5 w-5 text-blue-700 dark:text-blue-400 fill-current" />
                <p className="text-sm font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">FEATURED iPHONES</p>
              </div>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-br from-black to-gray-800 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                Best Sellers
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto text-base md:text-lg">
                Top-rated pre-owned iPhones in original condition. Never refurbished. Trusted by 1,247+ customers.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              {featuredProducts?.map((product) => {
                const productSale = sales?.find(s => s.product_id === product.id);
                const globalSale = sales?.find(s => s.is_global);
                const { finalPrice, discount } = calculateSalePrice(product.price, productSale, globalSale);
                
                return (
                  <Link key={product.id} to={`/product/${product.slug}`} className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] min-w-[280px] max-w-[400px]">
                    <Card className="bg-white dark:bg-gray-900 overflow-hidden rounded-2xl group relative h-full cursor-pointer border-2 border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-600 transition-all duration-300 shadow-md hover:shadow-xl">
                      {/* Badges Container */}
                      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                        {discount && (
                          <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white font-black px-3 py-1.5 shadow-lg animate-pulse">
                            {discount}% OFF
                          </Badge>
                        )}
                        <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-3 py-1">
                          Pre-Owned
                        </Badge>
                        {product.is_featured && !discount && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold px-3 py-1">
                            <Star className="h-3 w-3 mr-1" fill="white" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 relative overflow-hidden">
                        {product.images?.[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                      </div>
                      
                      <CardContent className="p-5">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1.5 uppercase tracking-wide truncate">
                          {product.categories?.name}
                        </p>
                        <h3 className="font-display text-lg md:text-xl font-bold mb-2 line-clamp-2 leading-tight">
                          {product.name}
                        </h3>
                        <div className="mb-4">
                          {discount ? (
                            <div className="space-y-1">
                              <p className="text-2xl font-black text-red-600 dark:text-red-500">
                                {formatPrice(finalPrice)}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground line-through font-semibold">
                                  {formatPrice(product.price)}
                                </p>
                                <Badge className="bg-green-600 text-white text-[10px] px-2 py-0">
                                  Save {formatPrice(product.price - finalPrice)}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <p className="text-2xl font-black text-foreground">
                              {formatPrice(product.price)}
                            </p>
                          )}
                        </div>
                        <Button className="w-full font-bold bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white" size="sm">
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Button asChild variant="outline" size="lg">
                <Link to="/shop">
                  View All Products <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

        <Footer />
      </div>
    </>
  );
};

export default Index;