import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Minus, Plus, ShoppingCart, X, Star, ShieldCheck, Truck, Banknote, Package } from "lucide-react";
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
        title={product.meta_title || `${product.name} | Buy Online at The Shopping Cart`}
        description={
          product.meta_description ||
          product.description ||
          `Buy ${product.name} online in Pakistan. Premium quality products at TheShoppingCart.shop with fast delivery.`
        }
        keywords={product.focus_keywords || [product.name, product.categories?.name || "", "buy online Pakistan"]}
        canonicalUrl={`https://theshoppingcart.shop/product/${product.slug}`}
        ogImage={productImages[0]}
        ogType="product"
        structuredData={structuredData}
      />

      <div className="min-h-screen flex flex-col">
        <Navbar />

        <main className="flex-1 py-8 md:py-12 bg-gradient-to-b from-leather-smoked/10 via-background to-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {/* Media Gallery */}
              <div className="space-y-3 md:space-y-4">
                {/* Media Carousel (Video + Images) */}
                {(product.video_url || (product.images && product.images.length > 0)) &&
                (product.video_url ? 1 : 0) + (product.images?.length || 0) > 1 ? (
                  <Carousel className="w-full">
                    <CarouselContent>
                      {/* Video as first carousel item */}
                      {product.video_url && (
                        <CarouselItem key="video">
                          <div className="aspect-square bg-gradient-to-br from-leather-espresso/10 to-leather-charcoal/10 rounded-xl overflow-hidden border-2 border-leather-tan/20 shadow-leather">
                            <video
                              src={product.video_url}
                              controls
                              className="w-full h-full object-cover"
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
                            className="aspect-square bg-gradient-to-br from-leather-espresso/10 to-leather-charcoal/10 rounded-xl overflow-hidden cursor-zoom-in border-2 border-leather-tan/20 hover:border-leather-gold/50 shadow-leather hover:shadow-gold-glow transition-all duration-300"
                            onClick={() => {
                              setSelectedImageIndex(index);
                              setZoomDialogOpen(true);
                            }}
                          >
                            <img
                              src={image}
                              alt={`${product.name} ${index + 1}`}
                              className="w-full h-full object-cover"
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
                      <div className="aspect-square bg-gradient-to-br from-leather-espresso/10 to-leather-charcoal/10 rounded-xl overflow-hidden border-2 border-leather-tan/20 shadow-leather">
                        <video
                          src={product.video_url}
                          controls
                          className="w-full h-full object-cover"
                          poster={product.images?.[0]}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : product.images?.[0] ? (
                      <div
                        className="aspect-square bg-gradient-to-br from-leather-espresso/10 to-leather-charcoal/10 rounded-xl overflow-hidden cursor-zoom-in border-2 border-leather-tan/20 hover:border-leather-gold/50 shadow-leather hover:shadow-gold-glow transition-all duration-300"
                        onClick={() => {
                          setSelectedImageIndex(0);
                          setZoomDialogOpen(true);
                        }}
                      >
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              <div className="space-y-4 md:space-y-6">
                <div className="glass-card p-6 md:p-8 rounded-xl border-leather-tan/20">
                  <p className="text-xs md:text-sm text-leather-gold font-semibold mb-2 uppercase tracking-wider">{product.categories?.name}</p>
                  {product.sku && <p className="text-xs md:text-sm text-muted-foreground mb-3">SKU: <span className="text-leather-cognac font-medium">{product.sku}</span></p>}
                  <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 text-refined leading-tight">
                    {product.name}
                  </h1>
                  {discount ? (
                    <div className="space-y-3">
                      <Badge className="bg-gradient-to-r from-destructive to-red-700 text-white font-bold px-4 py-2 text-sm shadow-lg animate-pulse">{discount}% OFF SALE</Badge>
                      <div className="flex items-baseline gap-3">
                        <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-destructive">{formatPrice(totalPrice)}</p>
                        <p className="text-lg md:text-xl text-muted-foreground line-through opacity-60">
                          {formatPrice(displayPrice * quantity)}
                        </p>
                      </div>
                      {quantity > 1 && (
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(finalPrice)} × {quantity}
                        </p>
                      )}
                    </div>
                   ) : (
                    <div>
                      <p className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-leather-gold to-leather-cognac bg-clip-text text-transparent">{formatPrice(totalPrice)}</p>
                      {quantity > 1 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatPrice(displayPrice)} × {quantity}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {product.stock_quantity !== undefined && product.stock_quantity < 10 && (
                  <div className="glass-card border-2 border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-4 animate-pulse">
                    {product.stock_quantity > 0 ? (
                      <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        🔥 Hurry! Only {product.stock_quantity} {product.stock_quantity === 1 ? "item" : "items"} left in
                        stock!
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-destructive">❌ Out of stock</p>
                    )}
                  </div>
                )}

{variations && variations.length > 0 && (
                  <div>
                    <h2 className="font-semibold text-base md:text-lg mb-3">Select Variation</h2>
                    <div className="flex flex-wrap gap-3">
                      {variations.map((variation) => {
                        const isOutOfStock = variation.quantity === 0;
                        const varSale = sales?.find((s) => s.product_id === product?.id);
                        const varGlobalSale = sales?.find((s) => s.is_global);
                        const varApplySale = variation.apply_sale !== false;
                        const { finalPrice: varFinalPrice, discount: varDiscount } = calculateSalePrice(
                          variation.price,
                          varSale,
                          varGlobalSale,
                          varApplySale
                        );
                        
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
                            className={`
                              relative px-4 py-3 rounded-xl transition-all duration-200
                              ${isOutOfStock 
                                ? 'opacity-40 cursor-not-allowed bg-card border-2 border-border' 
                                : selectedVariation?.id === variation.id
                                ? 'bg-primary text-primary-foreground shadow-lg scale-105 ring-2 ring-primary ring-offset-2'
                                : 'bg-card border-2 border-border hover:border-primary hover:shadow-md'
                              }
                            `}
                          >
                            {isOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <X className="h-12 w-12 text-destructive opacity-70" strokeWidth={3} />
                              </div>
                            )}
                            <div className={`text-center space-y-1 ${isOutOfStock ? 'opacity-50' : ''}`}>
                              <div className="font-semibold text-sm">{variation.name}</div>
                              {varDiscount ? (
                                <div className="space-y-0.5">
                                  <div className="text-xs font-bold">{formatPrice(varFinalPrice)}</div>
                                  <div className="text-xs line-through opacity-60">{formatPrice(variation.price)}</div>
                                </div>
                              ) : (
                                <div className="text-xs font-medium">{formatPrice(variation.price)}</div>
                              )}
                              {isOutOfStock && (
                                <div className="text-[10px] font-bold text-destructive">Out of Stock</div>
                              )}
                            </div>
                            {varDiscount && !isOutOfStock && (
                              <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                -{varDiscount}%
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {colors && colors.length > 0 && (
                  <div>
                    <h2 className="font-semibold text-base md:text-lg mb-3">Select Color</h2>
                    <div className="flex flex-wrap gap-3">
                      {colors.map((color) => {
                        const isOutOfStock = color.quantity === 0;
                        // Use color price if set, otherwise fall back to variation or product price
                        const colorDisplayPrice = (color.price && color.price > 0) 
                          ? color.price
                          : selectedVariation 
                          ? selectedVariation.price
                          : product?.price || 0;
                        const colorSale = sales?.find((s) => s.product_id === product?.id);
                        const colorGlobalSale = sales?.find((s) => s.is_global);
                        const colorApplySale = color.apply_sale !== false;
                        const { finalPrice: colorFinalPrice, discount: colorDiscount } = calculateSalePrice(
                          colorDisplayPrice,
                          colorSale,
                          colorGlobalSale,
                          colorApplySale
                        );
                        
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
                            className={`
                              relative px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-2
                              ${isOutOfStock 
                                ? 'opacity-40 cursor-not-allowed bg-card border-2 border-border' 
                                : selectedColor?.id === color.id
                                ? 'bg-primary text-primary-foreground shadow-lg scale-105 ring-2 ring-primary ring-offset-2'
                                : 'bg-card border-2 border-border hover:border-primary hover:shadow-md'
                              }
                            `}
                          >
                            {isOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <X className="h-12 w-12 text-destructive opacity-70" strokeWidth={3} />
                              </div>
                            )}
                            <div
                              className="w-6 h-6 rounded-full border-2 border-border"
                              style={{ backgroundColor: color.color_code }}
                            />
                            <div className={`text-center space-y-1 ${isOutOfStock ? 'opacity-50' : ''}`}>
                              <div className="font-semibold text-sm">{color.name}</div>
                              {colorDiscount ? (
                                <div className="space-y-0.5">
                                  <div className="text-xs font-bold">{formatPrice(colorFinalPrice)}</div>
                                  <div className="text-xs line-through opacity-60">{formatPrice(colorDisplayPrice)}</div>
                                </div>
                              ) : (
                                <div className="text-xs font-medium">{formatPrice(colorDisplayPrice)}</div>
                              )}
                              {isOutOfStock && (
                                <div className="text-[10px] font-bold text-destructive">Out of Stock</div>
                              )}
                            </div>
                            {colorDiscount && !isOutOfStock && (
                              <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                -{colorDiscount}%
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="font-semibold text-base md:text-lg mb-2">Quantity</h2>
                  <div className="flex items-center space-x-3 md:space-x-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 md:h-10 md:w-10"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    <span className="text-lg md:text-xl font-semibold w-10 md:w-12 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 md:h-10 md:w-10"
                      onClick={() => setQuantity(Math.min(product.stock_quantity || 99, quantity + 1))}
                      disabled={product.stock_quantity === 0}
                    >
                      <Plus className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 pt-2 md:pt-4">
                  <Button
                    className="w-full text-sm md:text-base h-12 md:h-14 btn-liquid-secondary btn-leather-texture font-semibold"
                    size="lg"
                    onClick={() => addToCart.mutate()}
                    disabled={addToCart.isPending || product.stock_quantity === 0}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5 md:h-6 md:w-6 icon-cart" />
                    Add to Cart
                  </Button>
                  <Button
                    className="w-full text-sm md:text-base h-12 md:h-14 btn-liquid-primary btn-leather-texture font-bold text-white"
                    size="lg"
                    onClick={handleBuyNow}
                    disabled={addToCart.isPending || product.stock_quantity === 0}
                  >
                    Buy Now
                  </Button>
                </div>
                {/* Trust Badges */}
                <div className="grid grid-cols-2 gap-4 py-6 border-y-2 border-leather-tan/20">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-leather-gold/20 to-leather-cognac/20 flex items-center justify-center shadow-inner">
                      <ShieldCheck className="h-5 w-5 text-leather-gold" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight text-foreground">7 Day Easy</p>
                      <p className="text-xs text-leather-cognac leading-tight">Return</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-leather-gold/20 to-leather-cognac/20 flex items-center justify-center shadow-inner">
                      <Banknote className="h-5 w-5 text-leather-cognac" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight text-foreground">Cash on</p>
                      <p className="text-xs text-leather-cognac leading-tight">Delivery</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-leather-gold/20 to-leather-cognac/20 flex items-center justify-center shadow-inner">
                      <Truck className="h-5 w-5 text-leather-gold" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight text-foreground">Free Delivery</p>
                      <p className="text-xs text-leather-cognac leading-tight">All Pakistan</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-leather-gold/20 to-leather-cognac/20 flex items-center justify-center shadow-inner">
                      <Package className="h-5 w-5 text-leather-cognac" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight text-foreground">100% Original</p>
                      <p className="text-xs text-leather-cognac leading-tight">Products</p>
                    </div>
                  </div>
                </div>
                {product.description && (
                  <div className="glass-card p-6 rounded-xl border-leather-tan/20">
                    <h2 className="font-display text-xl md:text-2xl font-bold mb-4 text-leather-gold">Product Description</h2>
                    <div className="divider-gold mb-4" />
                    <p className="text-sm md:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {product.description}
                    </p>
                  </div>
                )}
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
