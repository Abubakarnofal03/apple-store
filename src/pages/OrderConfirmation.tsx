import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { LoadingScreen } from "@/components/LoadingScreen";
import { trackPurchase as trackMetaPurchase } from "@/lib/metaPixel";
import { trackCompletePayment } from "@/lib/tiktokPixel";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [user, setUser] = useState<any>(null);
  const hasTrackedPurchase = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: orderItems } = useQuery({
    queryKey: ['order-items', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*, products(*)')
        .eq('order_id', orderId);
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  // Track purchase events only once when order is confirmed
  useEffect(() => {
    if (order && orderItems && orderItems.length > 0 && !hasTrackedPurchase.current) {
      // Check if this order has already been tracked in this session
      const trackedOrders = sessionStorage.getItem('tracked_orders');
      const trackedOrderIds = trackedOrders ? JSON.parse(trackedOrders) : [];
      
      if (!trackedOrderIds.includes(order.id)) {
        hasTrackedPurchase.current = true;
        
        // Track Meta Pixel Purchase
  trackMetaPurchase(order.total_amount, 'AED', order.id);
        
        // Track TikTok Pixel CompletePayment
        const tiktokItems = orderItems.map(item => ({
          id: item.product_id,
          quantity: item.quantity,
          price: item.price || 0,
        }));
        trackCompletePayment(order.id, order.total_amount, tiktokItems);
        
        // Mark this order as tracked
        trackedOrderIds.push(order.id);
        sessionStorage.setItem('tracked_orders', JSON.stringify(trackedOrderIds));
      }
    }
  }, [order, orderItems]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <LoadingScreen message="Loading order details..." />
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Order not found</p>
            <Button asChild>
              <Link to="/shop">Continue Shopping</Link>
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
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="font-display text-4xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your order. We'll process it shortly.
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="font-display text-2xl font-bold mb-4">Order Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-semibold">{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-semibold">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-accent">{formatPrice(order.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-semibold">Cash on Delivery</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <p className="text-sm">
                  {order.first_name} {order.last_name}<br />
                  {order.shipping_address}<br />
                  {order.shipping_city}, {order.shipping_state} {order.shipping_zip}<br />
                  Phone: {order.phone}
                  {order.email && <><br />Email: {order.email}</>}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="font-display text-2xl font-bold mb-4">Order Items</h2>
              
              <div className="space-y-4">
                {orderItems?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      {item.products?.images?.[0] && (
                        <img
                          src={item.products.images[0]}
                          alt={item.products.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{item.products?.name}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-semibold">
                      {formatPrice((item.price || 0) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-x-4">
            <Button asChild variant="outline">
              <Link to="/shop">Continue Shopping</Link>
            </Button>
            {user && (
              <Button asChild>
                <Link to="/orders">View Orders</Link>
              </Button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderConfirmation;
