import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Minus, Plus, ShoppingCart, X, Star, ShieldCheck, Truck, Banknote, Package, CheckCircle2, CreditCard, Award, Clock, Battery, Camera, Smartphone, Loader2 } from "lucide-react";
import { addToGuestCart } from "@/lib/cartUtils";
import { formatPrice } from "@/lib/currency";
import { LoadingScreen } from "@/components/LoadingScreen";
import { calculateSalePrice } from "@/lib/saleUtils";
import { Badge } from "@/components/ui/badge";
import { trackAddToCart as trackMetaAddToCart } from "@/lib/metaPixel";
import { trackViewContent, trackAddToCart as trackTikTokAddToCart } from "@/lib/tiktokPixel";
import { SEOHead } from "@/components/SEOHead";
import { organizationSchema, productSchema, breadcrumbSchema } from "@/lib/structuredData";
import ProductReviews from "@/components/ProductReviews";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const ProductDetail = ({ key }: { key?: string }) => {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomDialogOpen, setZoomDialogOpen] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Reset component state when slug changes
  useEffect(() => {
    setQuantity(1);
    setSelectedImageIndex(0);
    setSelectedVariation(null);
    setSelectedColor(null);
    
    // Invalidate all queries to ensure fresh data
    queryClient.invalidateQueries({ queryKey: ['product', slug] });
    queryClient.invalidateQueries({ queryKey: ['product-variations'] });
    queryClient.invalidateQueries({ queryKey: ['product-colors'] });
    queryClient.invalidateQueries({ queryKey: ['related-products'] });
  }, [slug, queryClient]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(*)").eq("slug", slug).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: sales } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("is_active", true)
        .gt("end_date", new Date().toISOString());
      if (error) throw error;
      return data;
    },
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(*)")
        .eq("category_id", product.category_id)
        .neq("id", product.id)
        .limit(4);
      if (error) throw error;
      return data;
    },
    enabled: !!product,
  });

  const { data: variations } = useQuery({
    queryKey: ["product-variations", product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      const { data, error } = await supabase
        .from("product_variations")
        .select("*")
        .eq("product_id", product.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!product,
  });

  const { data: colors } = useQuery({
    queryKey: ["product-colors", product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      const { data, error } = await supabase
        .from("product_colors")
        .select("*")
        .eq("product_id", product.id)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!product,
  });

  // Set first variation as default when variations load
  useEffect(() => {
    if (variations && variations.length > 0 && !selectedVariation) {
      setSelectedVariation(variations[0]);
    }
  }, [variations, selectedVariation]);

  // Set first color as default when colors load
  useEffect(() => {
    if (colors && colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0]);
    }
  }, [colors, selectedColor]);

  const addToCart = useMutation({
    mutationFn: async () => {
      // Determine the price to use (color > variation > product)
      const priceToUse = selectedColor 
        ? selectedColor.price 
        : selectedVariation 
        ? selectedVariation.price 
        : product.price;

      if (user) {
        // Check if item already exists in cart (considering both variation and color)
        const { data: existingItems } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", user.id)
          .eq("product_id", product.id);

        let existingItem = null;
        if (existingItems && existingItems.length > 0) {
          // Find exact match including variation and color
          existingItem = existingItems.find(item => 
            item.variation_id === (selectedVariation?.id || null) &&
            item.color_id === (selectedColor?.id || null)
          );
        }

        if (existingItem) {
          // Update quantity of existing item
          const { error } = await supabase
            .from("cart_items")
            .update({ quantity: existingItem.quantity + quantity })
            .eq("id", existingItem.id);
          if (error) throw error;
        } else {
          // Insert new cart item
          const { error } = await supabase.from("cart_items").insert({
            user_id: user.id,
            product_id: product.id,
            quantity,
            variation_id: selectedVariation?.id || null,
            variation_name: selectedVariation?.name || null,
            variation_price: selectedVariation?.price || null,
            color_id: selectedColor?.id || null,
            color_name: selectedColor?.name || null,
            color_code: selectedColor?.color_code || null,
            color_price: selectedColor?.price || null,
          });
          if (error) throw error;
        }
      } else {
        // Guest cart
        addToGuestCart({
          product_id: product.id,
          quantity,
          product_name: product.name,
          product_price: product.price,
          product_image: product.images?.[0],
          variation_id: selectedVariation?.id || null,
          variation_name: selectedVariation?.name || null,
          variation_price: selectedVariation?.price || null,
          color_id: selectedColor?.id || null,
          color_name: selectedColor?.name || null,
          color_code: selectedColor?.color_code || null,
          color_price: (selectedColor?.price && parseFloat(selectedColor.price) > 0) 
            ? parseFloat(selectedColor.price) 
            : null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });

      // Calculate sale price for tracking (use color > variation > product price)
      const basePrice = (selectedColor?.price && parseFloat(selectedColor.price) > 0)
        ? parseFloat(selectedColor.price)
        : selectedVariation 
        ? selectedVariation.price 
        : product.price;
      const productSale = sales?.find((s) => s.product_id === product.id);
      const globalSale = sales?.find((s) => s.is_global);
      const { finalPrice } = calculateSalePrice(basePrice, productSale, globalSale);

      // Track Meta Pixel AddToCart event
      trackMetaAddToCart(product.id, product.name, basePrice);

      // Track TikTok Pixel AddToCart event
      trackTikTokAddToCart(product.id, product.name, finalPrice);

      toast({
        title: "Added to cart",
        description: "Product has been added to your cart.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBuyNow = async () => {
    await addToCart.mutateAsync();
    navigate("/checkout");
  };

  // Calculate sale price (needed for tracking)
  // Use color price if selected and has value, otherwise variation price, otherwise product price
  const displayPrice = (selectedColor?.price && parseFloat(selectedColor.price) > 0)
    ? parseFloat(selectedColor.price)
    : selectedVariation 
    ? selectedVariation.price 
    : product?.price || 0;
  const productSale = sales?.find((s) => s.product_id === product?.id);
  const globalSale = sales?.find((s) => s.is_global);
  const applySaleToItem = selectedColor 
    ? selectedColor.apply_sale !== false 
    : selectedVariation 
    ? selectedVariation.apply_sale !== false 
    : true;
  const { finalPrice, discount } = calculateSalePrice(displayPrice, productSale, globalSale, applySaleToItem);
  
  // Calculate total price (finalPrice * quantity)
  const totalPrice = finalPrice * quantity;

  // Track TikTok Pixel ViewContent event when product loads
  useEffect(() => {
    if (product) {
      trackViewContent(product.id, product.name, finalPrice);
    }
  }, [product, finalPrice]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <LoadingScreen message="Loading product details..." />
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Product not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  const productImages = product.images || [];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema,
      productSchema({
        name: product.name,
        description: product.description || product.name,
        price: finalPrice,
        images: productImages,
        sku: product.sku,
        stock_quantity: product.stock_quantity,
      }),
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Shop", url: "/shop" },
        ...(product.categories
          ? [{ name: product.categories.name, url: `/shop?category=${product.categories.slug}` }]
          : []),
        { name: product.name, url: `/product/${product.slug}` },
      ]),
    ],
  };

  return (
    <>
      <SEOHead
        title={product.meta_title || `${product.name} | Buy Online at tech spot uae`}
        description={
          product.meta_description ||
          product.description ||
          `Buy ${product.name} online in UAE. Pre-owned in original condition. Premium quality at techspotuae.store with fast delivery.`
        }
        keywords={product.focus_keywords || [product.name, product.categories?.name || "", "buy online UAE"]}
        canonicalUrl={`https://techspotuae.store/product/${product.slug}`}
        ogImage={productImages[0]}
        ogType="product"
        structuredData={structuredData}
      />

      <div className="min-h-screen flex flex-col">
        <Navbar />

        <main className="flex-1 py-4 md:py-8 pb-32 lg:pb-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 items-start">
              {/* Media Gallery */}
              <div className="space-y-4 lg:sticky lg:top-24">
                {/* Media Carousel (Video + Images) */}
                {(product.video_url || (product.images && product.images.length > 0)) &&
                (product.video_url ? 1 : 0) + (product.images?.length || 0) > 1 ? (
                  <Carousel className="w-full">
                    <CarouselContent>
                      {/* Video as first carousel item */}
                      {product.video_url && (
                        <CarouselItem key="video">
                          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl overflow-hidden shadow-2xl">
                            <video
                              src={product.video_url}
                              controls
                              className="w-full h-full object-contain p-8"
                              poster={product.images?.[0]}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        </CarouselItem>
                      )}
                      {/* Images as subsequent carousel items */}
                      {product.images?.map((image, index) => (
                        <CarouselItem key={`image-${index}`}>
                          <div
                            className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl overflow-hidden cursor-zoom-in shadow-2xl hover:shadow-3xl transition-all duration-500"
                            onClick={() => {
                              setSelectedImageIndex(index);
                              setZoomDialogOpen(true);
                            }}
                          >
                            <img
                              src={image}
                              alt={`${product.name} ${index + 1}`}
                              className="w-full h-full object-contain p-8 hover:scale-105 transition-transform duration-700"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </Carousel>
                ) : (
                  /* Single item display */
                  <>
                    {product.video_url ? (
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl overflow-hidden shadow-2xl">
                        <video
                          src={product.video_url}
                          controls
                          className="w-full h-full object-contain p-8"
                          poster={product.images?.[0]}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : product.images?.[0] ? (
                      <div
                        className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl overflow-hidden cursor-zoom-in shadow-2xl hover:shadow-3xl transition-all duration-500"
                        onClick={() => {
                          setSelectedImageIndex(0);
                          setZoomDialogOpen(true);
                        }}
                      >
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain p-8 hover:scale-105 transition-transform duration-700" />
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              
              <div className="space-y-6">
                {/* Social Proof Banner */}
                <div className="space-y-6">
                  {/* Category Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="px-4 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-full border border-blue-200 dark:border-blue-800">
                      <p className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">{product.categories?.name}</p>
                    </div>
                    <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-3 py-1">
                      Pre-Owned • Excellent
                    </Badge>
                    <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold px-3 py-1">
                      ✓ 100% Original
                    </Badge>
                  </div>
                  
{/* Product Name */}
<div className="space-y-2">
  <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-2 leading-tight tracking-tight bg-gradient-to-br from-black to-gray-800 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
    {product.name}
  </h1>
  {product.sku && (
    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
      <Package className="h-3 w-3 md:h-4 md:w-4" />
      <span>
        SKU: <span className="font-bold">{product.sku}</span>
      </span>
    </div>
  )}
</div>

{/* Premium Pricing Section */}
<div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 rounded-3xl p-5 border-2 border-gray-200 dark:border-gray-800 shadow-xl">
  {discount ? (
    <div className="space-y-3">
      <div className="flex items-center gap-2 md:gap-3">
        <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white font-black px-3 py-1.5 text-xs md:text-sm uppercase tracking-wide shadow-lg animate-pulse">
          {discount}% OFF SALE
        </Badge>
        <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold px-2.5 py-1 text-xs md:text-sm">
          Best Price
        </Badge>
      </div>
      <div className="flex items-baseline gap-3 md:gap-4 flex-wrap">
        <div>
          <p className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-br from-black to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-none">
            {formatPrice(totalPrice)}
          </p>
          <p className="text-sm md:text-base text-muted-foreground font-semibold">
            Total Price
          </p>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-lg md:text-xl text-muted-foreground line-through decoration-2 decoration-red-500">
            {formatPrice(displayPrice * quantity)}
          </p>
          <p className="text-xs md:text-sm font-bold text-green-600 dark:text-green-400">
            Save {formatPrice((displayPrice * quantity) - totalPrice)}
          </p>
        </div>
      </div>
      {quantity > 1 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs md:text-sm text-muted-foreground font-semibold">
            <span className="text-foreground">{formatPrice(finalPrice)}</span> per unit × {quantity} units
          </p>
        </div>
      )}
    </div>
  ) : (
    <div className="space-y-2">
      <p className="text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-br from-black to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-none">
        {formatPrice(totalPrice)}
      </p>
      {quantity > 1 && (
        <p className="text-xs md:text-sm text-muted-foreground font-semibold">
          {formatPrice(displayPrice)} per unit × {quantity} units
        </p>
      )}
    </div>
  )}
</div>
</div>
                <div className="bg-gradient-to-r from-green-600 via-green-700 to-green-600 text-white rounded-2xl p-4 shadow-xl border border-green-500/30">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-black text-lg">4.9/5</span>
                      </div>
                      <div className="hidden md:block border-l border-green-400/50 pl-6">
                        <p className="text-sm font-bold">1,247 Happy Customers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="font-semibold">Trusted iPhone Store in UAE</span>
                    </div>
                  </div>
                </div>
                
                

                

                {product.stock_quantity !== undefined && product.stock_quantity < 20 && (
                  <div className={`rounded-2xl p-5 shadow-lg border-2 ${
                    product.stock_quantity > 0 
                      ? 'bg-gradient-to-r from-orange-50 via-red-50 to-orange-50 dark:from-orange-950/40 dark:via-red-950/40 dark:to-orange-950/40 border-orange-300 dark:border-orange-800' 
                      : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800'
                  }`}>
                    {product.stock_quantity > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-500 rounded-full p-2 shadow-lg">
                            <Package className="h-5 w-5 text-white animate-pulse" />
                          </div>
                          <div>
                            <p className="text-base font-black text-red-700 dark:text-red-400 uppercase tracking-wide">
                              ⚡ Limited Stock Alert!
                            </p>
                            <p className="text-sm font-bold text-red-600 dark:text-red-500">
                              Only {product.stock_quantity} {product.stock_quantity === 1 ? "iPhone" : "iPhones"} remaining at this price
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${(product.stock_quantity / 20) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-500 font-semibold">
                          🔥 Don't wait - Secure yours now before someone else does!
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                        <div>
                          <p className="text-base font-black text-red-700 dark:text-red-400">
                            OUT OF STOCK
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-500">
                            This iPhone is temporarily unavailable. Check back soon!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

{variations && variations.length > 0 && (
  <div className="space-y-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 rounded-3xl border border-blue-200 dark:border-blue-800">
    <div className="flex items-center gap-3 mb-4">
      <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-full p-2">
        <Smartphone className="h-5 w-5 text-white" />
      </div>
      <h2 className="text-base font-black text-foreground uppercase tracking-wider">Choose Model & Color</h2>
    </div>

    {/* Variations */}
    <div className="flex flex-wrap gap-2 mb-3">
      {variations.map((variation) => {
        const isOutOfStock = variation.quantity === 0;
        return (
          <button
            key={variation.id}
            onClick={() => {
              if (!isOutOfStock) {
                setSelectedVariation(variation);
                setQuantity(1);
              }
            }}
            disabled={isOutOfStock}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all
              ${isOutOfStock
                ? 'opacity-40 cursor-not-allowed bg-gray-200 dark:bg-gray-800 text-gray-500'
                : selectedVariation?.id === variation.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:text-blue-600'
              }`}
          >
            {variation.name}
          </button>
        );
      })}
    </div>

    {/* Colors (only show if colors exist) */}
    {colors && colors.length > 0 && (
      <div className="flex flex-wrap gap-3 mt-2">
        {colors.map((color) => {
          const isOutOfStock = color.quantity === 0;
          return (
            <button
              key={color.id}
              onClick={() => {
                if (!isOutOfStock) {
                  setSelectedColor(color);
                  setQuantity(1);
                }
              }}
              disabled={isOutOfStock}
              title={color.name}
              className={`w-8 h-8 rounded-full border-2 transition-all
                ${selectedColor?.id === color.id
                  ? 'ring-2 ring-blue-500 ring-offset-2'
                  : 'hover:ring-2 hover:ring-blue-300'
                }
                ${isOutOfStock ? 'opacity-30 cursor-not-allowed' : ''}
              `}
              style={{ backgroundColor: color.color_code || "#ccc" }}
            />
          );
        })}
      </div>
    )}
  </div>
)}


                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Quantity</h2>
                  <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-lg hover:bg-white dark:hover:bg-gray-700"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xl font-semibold w-16 text-center">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-lg hover:bg-white dark:hover:bg-gray-700"
                      onClick={() => setQuantity(Math.min(product.stock_quantity || 99, quantity + 1))}
                      disabled={product.stock_quantity === 0}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Premium Trust Badge - iPhone Focused */}
                <div className="bg-gradient-to-r from-black via-gray-900 to-black dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-white rounded-3xl p-6 shadow-2xl border-2 border-white/10 overflow-hidden relative">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="bg-gradient-to-br from-white to-gray-100 rounded-full p-3 shadow-xl">
                        <Award className="h-8 w-8 text-black" />
                      </div>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-3 shadow-xl">
                        <CheckCircle2 className="h-8 w-8 text-white" />
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3 shadow-xl">
                        <ShieldCheck className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-2xl font-black tracking-tight">100% AUTHENTIC iPHONE</p>
                      <p className="text-base font-semibold text-gray-300">Pre-Owned in Original Condition</p>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <span>Original Condition & Working Perfectly</span>
                        <span className="text-gray-600">•</span>
                        <span>Exellent Condition</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {product.description && (
                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 p-8 rounded-3xl border-2 border-gray-200 dark:border-gray-800 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-2">
                        <Battery className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-2xl font-black text-foreground">Specifications & Details</h2>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Key Features Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col items-center gap-2 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                          <Camera className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Pro Camera</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 p-4 bg-green-50 dark:bg-green-950/30 rounded-xl">
                          <Battery className="h-6 w-6 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">All-Day Battery</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
                          <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wide">Secure</span>
                        </div>
                      </div>
                      
                      {/* Description */}
                      <div>
                        <h3 className="text-lg font-bold mb-3 text-foreground">About This iPhone</h3>
                        <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {product.description}
                        </p>
                      </div>
                      
                      {/* What's Included */}
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-2xl p-5 border border-green-200 dark:border-green-800">
                        <p className="font-bold text-foreground mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          What's Included in Your Order:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Pre-Owned iPhone in Original Condition
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            USB-C/Lightning Cable (as available)
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Charging Brick (as available)
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            7-Day Store Testing Warranty
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Phone Case (Protection Included)
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Screen Protector Applied
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <p className="text-xs text-yellow-800 dark:text-yellow-300 font-semibold">
                            Note: These are pre-owned iPhones in excellent condition. Included accessories may vary. No original packaging included.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Premium iPhone Trust Features */}
                <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 rounded-3xl p-6 shadow-xl border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-5">
                    <Smartphone className="h-6 w-6 text-black dark:text-white" />
                    <h3 className="text-lg font-bold text-foreground">Why Buy From Us?</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
                      <div className="flex-shrink-0">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3">
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-foreground mb-1">100% Original Apple iPhone</p>
                        <p className="text-sm text-muted-foreground">Pre-owned in pristine condition. Genuine parts only. Works perfectly like new.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
                      <div className="flex-shrink-0">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-3">
                          <Award className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-foreground mb-1">Store Warranty & Quality Guaranteed</p>
                        <p className="text-sm text-muted-foreground">7-day testing warranty from our store. Phone fully tested and working perfectly.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
                      <div className="flex-shrink-0">
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-3">
                          <Truck className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-foreground mb-1">Free 2-Day Delivery in UAE</p>
                        <p className="text-sm text-muted-foreground">Track your order. Secure delivery to your doorstep.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
                      <div className="flex-shrink-0">
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-3">
                          <CreditCard className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-foreground mb-1">Cash on Delivery Available</p>
                        <p className="text-sm text-muted-foreground">Check the product, then pay. No upfront payment required.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
                      <div className="flex-shrink-0">
                        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full p-3">
                          <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-foreground mb-1">7-Day Easy Return Policy</p>
                        <p className="text-sm text-muted-foreground">Changed your mind? Return within 7 days for full refund.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-black to-gray-900 dark:from-gray-950 dark:to-gray-900 rounded-2xl shadow-lg border border-gray-800">
                      <div className="flex-shrink-0">
                        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full p-3">
                          <Star className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-white mb-1">Authorized iPhone Reseller</p>
                        <p className="text-sm text-gray-300">Verified seller with 5000+ satisfied customers. Top-rated iPhone store in UAE.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Call-to-Action Buttons - Always Visible at Bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md shadow-2xl lg:hidden">
              <div className="container mx-auto px-4 py-3 space-y-2 max-w-7xl">
                <Button
                  className="w-full text-base h-14 bg-gradient-to-r from-black via-gray-900 to-black hover:from-gray-900 hover:via-gray-800 hover:to-gray-900 text-white font-black rounded-xl shadow-xl transition-all duration-300 relative overflow-hidden group"
                  size="lg"
                  onClick={handleBuyNow}
                  disabled={addToCart.isPending || product.stock_quantity === 0}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {addToCart.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Smartphone className="h-5 w-5" />
                        BUY NOW
                        <CheckCircle2 className="h-4 w-4" />
                      </>
                    )}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-sm h-12 border-2 border-gray-900 dark:border-gray-100 font-bold rounded-xl hover:bg-gray-900 hover:text-white dark:hover:bg-gray-100 dark:hover:text-black transition-all duration-300"
                  size="lg"
                  onClick={() => addToCart.mutate()}
                  disabled={addToCart.isPending || product.stock_quantity === 0}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                {/* Stock Indicator */}
                {product.stock_quantity !== undefined && product.stock_quantity < 20 && (
                  <div className="flex items-center justify-center gap-2 text-xs text-red-600 dark:text-red-400 font-semibold">
                    <Clock className="h-4 w-4 animate-pulse" />
                    Only {product.stock_quantity} left!
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Sticky Buttons */}
            <div className="hidden lg:block fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md shadow-2xl">
              <div className="container mx-auto px-4 py-4 max-w-7xl">
                <div className="flex items-center gap-4">
                  {/* Price Display */}
                  <div className="flex-1">
                    <div className="flex items-baseline gap-3">
                      <div>
                        <p className="text-3xl font-black text-foreground">{formatPrice(totalPrice)}</p>
                        {discount && (
                          <p className="text-sm text-muted-foreground line-through">{formatPrice(displayPrice * quantity)}</p>
                        )}
                      </div>
                      {discount && (
                        <Badge className="bg-red-600 text-white">{discount}% OFF</Badge>
                      )}
                    </div>
                  </div>
                  {/* Buttons */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="text-base h-14 border-2 border-gray-900 dark:border-gray-100 font-bold rounded-xl hover:bg-gray-900 hover:text-white dark:hover:bg-gray-100 dark:hover:text-black transition-all duration-300 px-8"
                      onClick={() => addToCart.mutate()}
                      disabled={addToCart.isPending || product.stock_quantity === 0}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Add to Cart
                    </Button>
                    <Button
                      className="text-lg h-14 bg-gradient-to-r from-black via-gray-900 to-black hover:from-gray-900 hover:via-gray-800 hover:to-gray-900 text-white font-black rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group px-8 min-w-[200px]"
                      size="lg"
                      onClick={handleBuyNow}
                      disabled={addToCart.isPending || product.stock_quantity === 0}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {addToCart.isPending ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Smartphone className="h-5 w-5" />
                            BUY NOW
                          </>
                        )}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Reviews */}
            <div className="mt-12 md:mt-20">
              <ProductReviews productId={product.id} />
            </div>

            {/* Related Products */}
            {relatedProducts && relatedProducts.length > 0 && (
              <div className="mt-12 md:mt-20">
                <div className="text-center mb-8">
                  <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-3 gold-accent pb-6">
                    You May Also Like
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Discover more from our curated collection
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {relatedProducts.map((relatedProduct) => {
                    const relatedProductSale = sales?.find((s) => s.product_id === relatedProduct.id);
                    const relatedGlobalSale = sales?.find((s) => s.is_global);
                    const { finalPrice: relatedFinalPrice, discount: relatedDiscount } = calculateSalePrice(
                      relatedProduct.price,
                      relatedProductSale,
                      relatedGlobalSale,
                    );

                    return (
                      <Card
                        key={relatedProduct.id}
                        className="glass-card overflow-hidden rounded-xl relative border-leather-tan/20 hover:border-leather-gold/50 shadow-leather hover:shadow-gold-glow transition-all duration-300 group cursor-pointer"
                      >
                        {relatedDiscount && (
                          <Badge className="absolute top-3 left-3 z-10 bg-gradient-to-r from-destructive to-red-700 text-white font-bold px-3 py-1 shadow-lg">
                            {relatedDiscount}% OFF
                          </Badge>
                        )}
                        <div className="aspect-square bg-gradient-to-br from-leather-espresso/10 to-leather-charcoal/10 relative overflow-hidden">
                          {relatedProduct.images?.[0] && (
                            <>
                              <img
                                src={relatedProduct.images[0]}
                                alt={relatedProduct.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-leather-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </>
                          )}
                        </div>
                        <CardContent className="p-3 md:p-4">
                          <h3 className="font-display text-sm md:text-base font-semibold mb-1 md:mb-2 truncate">
                            {relatedProduct.name}
                          </h3>
                          <div className="mb-2 md:mb-3">
                            {relatedDiscount ? (
                              <div className="flex items-baseline gap-2">
                                <p className="text-lg md:text-xl font-bold text-destructive">
                                  {formatPrice(relatedFinalPrice)}
                                </p>
                                <p className="text-xs text-muted-foreground line-through opacity-60">
                                  {formatPrice(relatedProduct.price)}
                                </p>
                              </div>
                            ) : (
                              <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-leather-gold to-leather-cognac bg-clip-text text-transparent">
                                {formatPrice(relatedProduct.price)}
                              </p>
                            )}
                          </div>
                          <Button 
                            asChild 
                            className="w-full text-xs md:text-sm btn-liquid-primary btn-leather-texture font-semibold text-white" 
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              // Force a full page reload to ensure fresh data
                              window.location.href = `/product/${relatedProduct.slug}`;
                            }}
                          >
                            <Link to={`/product/${relatedProduct.slug}`} onClick={(e) => e.preventDefault()}>
                              View Details
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Image Zoom Dialog */}
        <Dialog open={zoomDialogOpen} onOpenChange={setZoomDialogOpen}>
          <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-50 rounded-full bg-background/80 hover:bg-background"
              onClick={() => setZoomDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            {product.images && product.images[selectedImageIndex] && (
              <img
                src={product.images[selectedImageIndex]}
                alt={`${product.name} ${selectedImageIndex + 1}`}
                className="w-full h-auto max-h-[90vh] object-contain"
              />
            )}
          </DialogContent>
        </Dialog>

        <Footer />
      </div>
    </>
  );
};

export default ProductDetail;
