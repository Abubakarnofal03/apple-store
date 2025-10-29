import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Star, CheckCircle2, Award, ShieldCheck, Truck, CreditCard, Smartphone } from "lucide-react";
import { addToGuestCart } from "@/lib/cartUtils";
import { formatPrice } from "@/lib/currency";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SEOHead } from "@/components/SEOHead";
import { organizationSchema, breadcrumbSchema } from "@/lib/structuredData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateSalePrice } from "@/lib/saleUtils";
import { trackAddToCart } from "@/lib/metaPixel";

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category");
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("50000");
  const [debouncedMinPrice, setDebouncedMinPrice] = useState("0");
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState("50000");
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce price changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinPrice(minPrice);
      setDebouncedMaxPrice(maxPrice);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
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

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', selectedCategory, debouncedMinPrice, debouncedMaxPrice],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, categories(*)', { count: 'exact' })
        .gte('price', parseFloat(debouncedMinPrice))
        .lte('price', parseFloat(debouncedMaxPrice));

      if (selectedCategory) {
        const category = categories?.find(c => c.slug === selectedCategory);
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
    enabled: !!categories,
  });

  const addToCart = useMutation({
    mutationFn: async (product: any) => {
      if (!user) {
        addToGuestCart({
          product_id: product.id,
          quantity: 1,
          product_name: product.name,
          product_price: product.price,
          product_image: product.images?.[0],
        });
        return product;
      }

      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: 1,
          });
        if (error) throw error;
      }
      
      return product;
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      
      // Track Meta Pixel AddToCart event
      trackAddToCart(product.id, product.name, product.price);
      
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart.",
      });
    },
  });

  const handleCategoryChange = (value: string) => {
    if (value === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ category: value });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <LoadingScreen message="Loading products..." />
        <Footer />
      </div>
    );
  }

  const selectedCategoryData = categories?.find(c => c.slug === selectedCategory);
  const pageTitle = selectedCategoryData
    ? `Buy ${selectedCategoryData.name} Online in UAE | tech spot uae`
    : "Buy Authentic iPhones Online in UAE | tech spot uae";
  const pageDescription = selectedCategoryData
    ? `Buy premium ${selectedCategoryData.name.toLowerCase()} online in UAE. Pre-owned in original condition, never refurbished. Fast delivery at techspotuae.store`
    : "Browse authentic pre-owned iPhones in original condition, never refurbished. Fast delivery across UAE at techspotuae.store.";
  const pageKeywords = selectedCategoryData?.focus_keywords || [
    'buy iphone online UAE',
    'pre-owned iphone',
    'authentic iphone',
    'iphone store UAE',
    'never refurbished',
    'buy online UAE'
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema,
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Shop", url: "/shop" },
        ...(selectedCategoryData ? [{ name: selectedCategoryData.name, url: `/shop?category=${selectedCategory}` }] : [])
      ])
    ]
  };

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        keywords={pageKeywords}
        canonicalUrl={selectedCategory ? `https://techspotuae.store/shop?category=${selectedCategory}` : "https://techspotuae.store/shop"}
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

        <section className="py-8 md:py-12 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-full border border-blue-200 dark:border-blue-800 mb-4">
                <Smartphone className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                <p className="text-sm font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">iPHONE STORE UAE</p>
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-center mb-4">
                <span className="bg-gradient-to-br from-black to-gray-800 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                  Browse Authentic iPhones
                </span>
              </h1>
              <p className="text-center text-muted-foreground max-w-3xl mx-auto text-base md:text-lg px-4">
                Pre-owned in original condition, never refurbished. Premium quality iPhones with full testing warranty.
              </p>
            </div>

            {/* Premium Trust Features */}
            <div className="max-w-5xl mx-auto mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-800 shadow-md">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3 w-fit mx-auto mb-2">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs font-bold text-foreground mb-1">Never Refurbished</p>
                <p className="text-xs text-muted-foreground">Original Quality</p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-800 shadow-md">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-3 w-fit mx-auto mb-2">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs font-bold text-foreground mb-1">Store Warranty</p>
                <p className="text-xs text-muted-foreground">7-Day Testing</p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-800 shadow-md">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-3 w-fit mx-auto mb-2">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs font-bold text-foreground mb-1">Free Delivery</p>
                <p className="text-xs text-muted-foreground">2-Day UAE</p>
              </div>
              
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-800 shadow-md">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-3 w-fit mx-auto mb-2">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs font-bold text-foreground mb-1">COD Available</p>
                <p className="text-xs text-muted-foreground">Pay on Delivery</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1 space-y-4 md:space-y-6">
                <Card className="glass-card rounded-xl">
                  <CardContent className="p-4 md:p-6">
                    <h3 className="font-display text-base md:text-lg font-semibold mb-3 md:mb-4">Filters</h3>
                    
                    <div className="space-y-4 md:space-y-6">
                      <div>
                        <label className="text-xs md:text-sm font-medium mb-2 md:mb-3 block">Category</label>
                        <Select value={selectedCategory || "all"} onValueChange={handleCategoryChange}>
                          <SelectTrigger className="w-full text-sm">
                            <SelectValue placeholder="All Categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.slug}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-xs md:text-sm font-medium mb-2 md:mb-3 block">
                          Price Range
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Min</Label>
                            <Input
                              type="number"
                              min="0"
                              value={minPrice}
                              onChange={(e) => setMinPrice(e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Max</Label>
                            <Input
                              type="number"
                              min="0"
                              value={maxPrice}
                              onChange={(e) => setMaxPrice(e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Showing: {formatPrice(parseFloat(debouncedMinPrice))} - {formatPrice(parseFloat(debouncedMaxPrice))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Products Grid */}
              <div className="lg:col-span-3">
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading products...</p>
                  </div>
                ) : products?.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No products found with the selected filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                     {products?.map((product) => {
                      const productSale = sales?.find(s => s.product_id === product.id);
                      const globalSale = sales?.find(s => s.is_global);
                      const { finalPrice, discount } = calculateSalePrice(product.price, productSale, globalSale);
                      
                      return (
                        <Link key={product.id} to={`/product/${product.slug}`} className="block transition-all duration-300 active:scale-95">
                          <Card className="bg-white dark:bg-gray-900 overflow-hidden rounded-2xl group relative cursor-pointer border-2 border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-600 transition-all duration-300 shadow-md hover:shadow-xl">
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
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="absolute bottom-4 left-4 right-4">
                                <div className="bg-white dark:bg-gray-900 rounded-lg p-2 mb-2">
                                  <Badge className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-xs justify-center py-1">
                                    ✓ Never Refurbished
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <CardContent className="p-4 md:p-5">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1.5 uppercase tracking-wide truncate">
                              {product.categories?.name}
                            </p>
                              <h3 className="font-display text-lg md:text-xl font-bold mb-2 line-clamp-2 leading-tight">
                                {product.name}
                              </h3>
                              {product.sku && (
                                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                  <span className="font-semibold">SKU:</span> {product.sku}
                                </p>
                              )}
                              
                              {/* Price Section */}
                              <div className="mb-3">
                                {discount ? (
                                  <div className="space-y-1">
                                    <p className="text-2xl md:text-3xl font-black text-red-600 dark:text-red-500">
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
                                  <p className="text-2xl md:text-3xl font-black text-foreground">
                                    {formatPrice(product.price)}
                                  </p>
                                )}
                              </div>
                              
                            {/* Stock Status */}
                            {product.stock_quantity !== undefined && product.stock_quantity < 10 && product.stock_quantity > 0 && (
                              <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-2 mb-3 border border-orange-200 dark:border-orange-800">
                                <p className="text-xs font-bold text-orange-700 dark:text-orange-400">
                                  ⚡ Only {product.stock_quantity} left!
                                </p>
                              </div>
                            )}
                              {product.stock_quantity === 0 && (
                                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-2 mb-3 border border-red-200 dark:border-red-800">
                                  <p className="text-xs font-bold text-red-700 dark:text-red-400">Out of stock</p>
                                </div>
                              )}
                              
                              {/* Action Buttons */}
                              <div className="grid grid-cols-2 gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addToCart.mutate(product);
                                  }}
                                  disabled={addToCart.isPending || product.stock_quantity === 0}
                                  className="text-xs h-10 border-2"
                                >
                                  <ShoppingCart className="h-4 w-4 mr-1.5" />
                                  Add
                                </Button>
                                <Button size="sm" className="text-xs h-10 font-bold bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white">
                                  View
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
    </>
  );
};

export default Shop;