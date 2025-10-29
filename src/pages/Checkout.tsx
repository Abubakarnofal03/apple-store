import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getGuestCart, clearGuestCart, GuestCartItem } from "@/lib/cartUtils";
import { formatPrice } from "@/lib/currency";
import { trackInitiateCheckout as trackMetaInitiateCheckout } from "@/lib/metaPixel";
import { trackInitiateCheckout as trackTikTokInitiateCheckout } from "@/lib/tiktokPixel";
import { calculateSalePrice, Sale } from "@/lib/saleUtils";

const Checkout = () => {
  const [user, setUser] = useState<any>(null);
  const [guestCart, setGuestCart] = useState<GuestCartItem[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "+92",
    addressLine1: "",
    addressLine2: "",
    city: "",
  });
  const [phoneError, setPhoneError] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (!session) {
        setGuestCart(getGuestCart());
      } else {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: profile }) => {
            if (profile) {
              setFormData(prev => ({
                ...prev,
                firstName: profile.full_name?.split(' ')[0] || '',
                lastName: profile.full_name?.split(' ')[1] || '',
                email: profile.email || session.user.email || '',
                phone: profile.phone || '+92',
                addressLine1: profile.address || '',
                city: profile.city || '',
              }));
            }
          });
      }
    });
    
    // Track Meta Pixel InitiateCheckout event when user lands on checkout page
    trackMetaInitiateCheckout();
  }, []);

  const { data: cartItems } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, products(*), product_colors(*)')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch active sales for price calculation
  const { data: activeSales } = useQuery({
    queryKey: ['sales', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('is_active', true)
        .gt('end_date', new Date().toISOString());
      
      if (error) throw error;
      return data as Sale[];
    },
  });

  const items = user ? cartItems : guestCart;
  
  // Calculate total with sales applied
  const total = user 
    ? cartItems?.reduce((sum, item) => {
        const price = item.color_price || item.variation_price || item.products?.price || 0;
        const productSale = activeSales?.find(
          sale => !sale.is_global && sale.product_id === item.product_id
        ) || null;
        const globalSale = activeSales?.find(sale => sale.is_global) || null;
        const { finalPrice } = calculateSalePrice(price, productSale, globalSale);
        return sum + finalPrice * item.quantity;
      }, 0) || 0
    : guestCart.reduce((sum, item) => {
        const price = item.color_price || item.variation_price || item.product_price;
        const productSale = activeSales?.find(
          sale => !sale.is_global && sale.product_id === item.product_id
        ) || null;
        const globalSale = activeSales?.find(sale => sale.is_global) || null;
        const { finalPrice } = calculateSalePrice(price, productSale, globalSale);
        return sum + finalPrice * item.quantity;
      }, 0);

  // Track TikTok Pixel InitiateCheckout when cart data is loaded
  useEffect(() => {
    if (items && items.length > 0 && total > 0) {
      const tiktokItems = items.map((item: any) => ({
        id: user ? item.product_id : item.product_id,
        quantity: item.quantity,
        price: user ? (item.products?.price || 0) : item.product_price,
      }));
      trackTikTokInitiateCheckout(total, tiktokItems);
    }
  }, [items, total, user]);

  const validatePhoneNumber = (phone: string): { isValid: boolean; formatted: string; error: string } => {
    // Remove all spaces and dashes for validation
    let cleanPhone = phone.replace(/[\s-]/g, '');
    
    // Check if it starts with +92
    if (!cleanPhone.startsWith('+92')) {
      return { isValid: false, formatted: phone, error: "Phone number must start with +92" };
    }
    
    // Remove +92 prefix to check the rest
    let numberPart = cleanPhone.slice(3);
    
    // If it starts with 0, remove it
    if (numberPart.startsWith('0')) {
      numberPart = numberPart.slice(1);
      cleanPhone = '+92' + numberPart;
    }
    
    // Check if the number part has exactly 10 digits
    if (!/^\d{10}$/.test(numberPart)) {
      return { 
        isValid: false, 
        formatted: cleanPhone, 
        error: `Phone number must have exactly 10 digits after +92 (currently ${numberPart.length})` 
      };
    }
    
    return { isValid: true, formatted: cleanPhone, error: "" };
  };

  const isPhoneValid = validatePhoneNumber(formData.phone).isValid;
  const isFormValid = formData.firstName && formData.city && isPhoneValid && 
                      formData.addressLine1;

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!isFormValid) {
        setShowErrors(true);
        const validation = validatePhoneNumber(formData.phone);
        if (!validation.isValid) {
          setPhoneError(validation.error);
        }
        throw new Error("Please fill in all required fields");
      }

      if (!items || items.length === 0) {
        throw new Error("Your cart is empty");
      }

      // Format phone number before saving
      const phoneValidation = validatePhoneNumber(formData.phone);
      const formattedPhone = phoneValidation.formatted;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || null,
          phone: formattedPhone,
          shipping_address: formData.addressLine1 + (formData.addressLine2 ? `, ${formData.addressLine2}` : ''),
          shipping_city: formData.city,
          shipping_state: null,
          shipping_zip: null,
          total_amount: total,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item: any) => {
        const originalPrice = user 
          ? (item.color_price || item.variation_price || item.products?.price || 0)
          : (item.color_price || item.variation_price || item.product_price);
        const productId = user ? item.product_id : item.product_id;
        
        // Apply sales when storing order items
        const productSale = activeSales?.find(
          sale => !sale.is_global && sale.product_id === productId
        ) || null;
        const globalSale = activeSales?.find(sale => sale.is_global) || null;
        const { finalPrice } = calculateSalePrice(originalPrice, productSale, globalSale);
        
        return {
          order_id: order.id,
          product_id: productId,
          quantity: item.quantity,
          price: finalPrice,
          variation_id: item.variation_id || null,
          variation_name: item.variation_name || null,
          variation_price: item.variation_price || null,
          color_id: item.color_id || null,
          color_name: item.color_name || null,
          color_code: item.color_code || null,
          color_price: item.color_price || null,
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      if (user) {
        const { error: clearError } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);
        if (clearError) throw clearError;
      } else {
        clearGuestCart();
      }

      return order.id;
    },
    onSuccess: (orderId) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({
        title: "Order placed successfully!",
        description: "Thank you for your order. We'll process it shortly.",
      });
      navigate(`/order-confirmation/${orderId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error placing order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // Clear phone error when user starts typing
      setPhoneError("");
      
      // If user tries to delete +92, prevent it
      if (!value.startsWith('+92')) {
        setFormData(prev => ({
          ...prev,
          phone: '+92',
        }));
        return;
      }
      
      // Validate on blur or when complete
      const validation = validatePhoneNumber(value);
      if (value.length >= 13) { // +92 + 10 digits
        setPhoneError(validation.error);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!items || items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => navigate('/shop')}>
              Continue Shopping
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-center gold-accent pb-6 md:pb-8">
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-4 md:p-6">
                  <h2 className="font-display text-xl md:text-2xl font-bold mb-4 md:mb-6">Shipping Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className={`mt-1 ${showErrors && !formData.firstName ? 'border-destructive' : ''}`}
                      />
                      {showErrors && !formData.firstName && (
                        <p className="text-destructive text-xs mt-1">First name is required</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm">Email (Optional)</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+923001234567"
                        required
                        className={`mt-1 ${(showErrors && !isPhoneValid) || phoneError ? 'border-destructive' : ''}`}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Format: +92 followed by 10 digits (e.g., +923001234567)
                      </p>
                      {showErrors && !formData.phone && (
                        <p className="text-destructive text-xs mt-1">Phone number is required</p>
                      )}
                      {phoneError && (
                        <p className="text-destructive text-xs mt-1">{phoneError}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="addressLine1" className="text-sm">Address (Please mention house no, street no, area, city) *</Label>
                      <Input
                        id="addressLine1"
                        name="addressLine1"
                        value={formData.addressLine1}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. House 123, Street 4, DHA Phase 2, Karachi"
                        className={`mt-1 ${showErrors && !formData.addressLine1 ? 'border-destructive' : ''}`}
                      />
                      {showErrors && !formData.addressLine1 && (
                        <p className="text-destructive text-xs mt-1">Address is required</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="addressLine2" className="text-sm">Address Line 2 (Optional)</Label>
                      <Input
                        id="addressLine2"
                        name="addressLine2"
                        value={formData.addressLine2}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="city" className="text-sm">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className={`mt-1 ${showErrors && !formData.city ? 'border-destructive' : ''}`}
                      />
                      {showErrors && !formData.city && (
                        <p className="text-destructive text-xs mt-1">City is required</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardContent className="p-4 md:p-6">
                  <h2 className="font-display text-xl md:text-2xl font-bold mb-4">Order Summary</h2>
                  
                  <div className="space-y-3 md:space-y-4 mb-4 md:mb-6 max-h-60 overflow-y-auto">
                    {items?.map((item: any, idx: number) => {
                      const isGuest = !user;
                      const originalPrice = isGuest 
                        ? (item.color_price || item.variation_price || item.product_price)
                        : (item.color_price || item.variation_price || item.products?.price || 0);
                      const productId = isGuest ? item.product_id : item.product_id;
                      
                      // Calculate sale price for each item
                      const productSale = activeSales?.find(
                        sale => !sale.is_global && sale.product_id === productId
                      ) || null;
                      const globalSale = activeSales?.find(sale => sale.is_global) || null;
                      const { finalPrice } = calculateSalePrice(originalPrice, productSale, globalSale);
                      
                      const productData = {
                        name: isGuest ? item.product_name : item.products?.name,
                        price: finalPrice,
                        variationName: item.variation_name,
                        colorName: item.color_name,
                      };

                      return (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="truncate pr-2">
                            {productData.name}
                            {productData.variationName && (
                              <span className="text-xs text-muted-foreground"> ({productData.variationName})</span>
                            )}
                            {productData.colorName && (
                              <span className="text-xs text-muted-foreground"> - {productData.colorName}</span>
                            )}
                            {' × '}{item.quantity}
                          </span>
                          <span className="font-semibold whitespace-nowrap">
                            {formatPrice(productData.price * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2 mb-4 md:mb-6 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>FREE</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-base md:text-lg">
                        <span>Total</span>
                        <span className="text-accent">{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 md:p-4 rounded-lg mb-4 md:mb-6">
                    <p className="text-sm font-semibold mb-1">Payment Method</p>
                    <p className="text-xs md:text-sm text-muted-foreground">Cash on Delivery (COD)</p>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => placeOrder.mutate()}
                    disabled={placeOrder.isPending || !isFormValid}
                  >
                    {placeOrder.isPending ? "Processing..." : "Place Order"}
                  </Button>
                  {showErrors && !isFormValid && (
                    <p className="text-destructive text-sm mt-2 text-center">Please fill in all required fields</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
