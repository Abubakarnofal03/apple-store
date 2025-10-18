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
import { ShoppingCart, Star } from "lucide-react";
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
    ? `Shop ${selectedCategoryData.name} Online | The Shopping Cart`
    : "Shop All Products Online | The Shopping Cart";
  const pageDescription = selectedCategoryData
    ? `Browse premium ${selectedCategoryData.name.toLowerCase()} online in Pakistan. Quality products, fast delivery at TheShoppingCart.shop`
    : "Discover premium home decor, wallets, accessories, and furniture at TheShoppingCart.shop – fast delivery across Pakistan.";
  const pageKeywords = selectedCategoryData?.focus_keywords || [
    'online shopping Pakistan',
    'home decor',
    'wallets',
    'furniture',
    'accessories',
    'buy online Pakistan'
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
        canonicalUrl={selectedCategory ? `https://theshoppingcart.shop/shop?category=${selectedCategory}` : "https://theshoppingcart.shop/shop"}
        structuredData={structuredData}
      />
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
      
      <main className="flex-1">
        <section className="py-8 md:py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-3 md:mb-4 gold-accent pb-6 md:pb-8">
              Our Collection
            </h1>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto text-sm md:text-base px-4">
              Explore our curated selection of premium products
            </p>
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
                          <Card className="glass-card glass-hover overflow-hidden rounded-xl group relative cursor-pointer">
                            {discount && (
                              <Badge className="absolute top-2 left-2 z-10 bg-destructive text-destructive-foreground">
                                {discount}% OFF
                              </Badge>
                            )}
                            {product.is_featured && !discount && (
                              <Badge className="absolute top-2 left-2 z-10 bg-accent text-accent-foreground">
                                <Star className="h-3 w-3 mr-1" fill="currentColor" />
                                Featured
                              </Badge>
                            )}
                          <div className="aspect-square bg-muted relative overflow-hidden">
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                          </div>
                          <CardContent className="p-3 md:p-4">
                            <p className="text-xs text-muted-foreground mb-1 truncate">
                              {product.categories?.name}
                            </p>
                              <h3 className="font-display text-base md:text-lg font-semibold mb-1 md:mb-2 truncate">
                                {product.name}
                              </h3>
                              {product.sku && (
                                <p className="text-xs text-muted-foreground mb-1">
                                  SKU: {product.sku}
                                </p>
                              )}
                              <div className="mb-1 md:mb-2">
                                {discount ? (
                                  <div className="flex items-center gap-2">
                                    <p className="text-lg md:text-xl font-bold text-destructive">
                                      {formatPrice(finalPrice)}
                                    </p>
                                    <p className="text-sm text-muted-foreground line-through">
                                      {formatPrice(product.price)}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-lg md:text-xl font-bold text-accent">
                                    {formatPrice(product.price)}
                                  </p>
                                )}
                              </div>
                            {product.stock_quantity !== undefined && product.stock_quantity < 10 && product.stock_quantity > 0 && (
                              <p className="text-xs text-orange-500 mb-2">
                                Only {product.stock_quantity} left in stock!
                              </p>
                            )}
                              {product.stock_quantity === 0 && (
                                <p className="text-xs text-destructive mb-2">Out of stock</p>
                              )}
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
                                  className="text-xs md:text-sm"
                                >
                                  <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                                <Button size="sm" className="text-xs md:text-sm">
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