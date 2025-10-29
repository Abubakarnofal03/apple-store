import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Filter, MapPin, Package, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { formatPrice } from "@/lib/currency";

interface OrderAnalyticsProps {
  orders: any[];
  products: any[];
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  selectedProduct: string;
  setSelectedProduct: (product: string) => void;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', 'hsl(var(--muted))', '#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

export const OrderAnalytics = ({
  orders,
  products,
  selectedCity,
  setSelectedCity,
  selectedProduct,
  setSelectedProduct,
}: OrderAnalyticsProps) => {
  const cities = useMemo(() => {
    const citySet = new Set(orders?.map(order => order.shipping_city) || []);
    return Array.from(citySet).filter(Boolean).sort();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    return orders.filter(order => {
      const cityMatch = selectedCity === "all" || order.shipping_city === selectedCity;
      
      let productMatch = selectedProduct === "all";
      if (!productMatch && order.order_items) {
        productMatch = order.order_items.some((item: any) => item.product_id === selectedProduct);
      }
      
      return cityMatch && productMatch;
    });
  }, [orders, selectedCity, selectedProduct]);

  const cityStats = useMemo(() => {
    if (!orders) return [];
    
    const stats = new Map<string, { orders: number; revenue: number }>();
    
    orders.forEach(order => {
      const city = order.shipping_city || 'Unknown';
      const current = stats.get(city) || { orders: 0, revenue: 0 };
      stats.set(city, {
        orders: current.orders + 1,
        revenue: current.revenue + Number(order.total_amount),
      });
    });
    
    return Array.from(stats.entries())
      .map(([city, data]) => ({ city, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [orders]);

  const productStats = useMemo(() => {
    if (!orders) return [];
    
    const stats = new Map<string, { quantity: number; revenue: number; name: string }>();
    
    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const productId = item.product_id;
        const productName = item.products?.name || 'Unknown Product';
        const current = stats.get(productId) || { quantity: 0, revenue: 0, name: productName };
        stats.set(productId, {
          name: productName,
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + (item.price * item.quantity),
        });
      });
    });
    
    return Array.from(stats.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [orders]);

  // Calculate revenue only for delivered orders
  const deliveredOrders = filteredOrders.filter(order => order.status === 'delivered');
  const totalRevenue = deliveredOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by City</label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Product</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products?.map(product => (
                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Filtered Orders</p>
                <p className="text-3xl font-bold">{totalOrders}</p>
              </div>
              <BarChart3 className="h-12 w-12 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
              </div>
              <DollarSign className="h-12 w-12 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatPrice(averageOrderValue)}</p>
              </div>
              <Package className="h-12 w-12 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Cities by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cityStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatPrice(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Products by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productStats}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => entry.name}
                >
                  {productStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatPrice(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtered Orders Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No orders match the selected filters</p>
            ) : (
              <div className="space-y-2">
                {filteredOrders.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">Order #{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">{order.shipping_city}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-accent">{formatPrice(Number(order.total_amount))}</p>
                      <p className="text-sm text-muted-foreground">{order.order_items?.length || 0} items</p>
                    </div>
                  </div>
                ))}
                {filteredOrders.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground pt-2">
                    Showing 10 of {filteredOrders.length} orders
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
