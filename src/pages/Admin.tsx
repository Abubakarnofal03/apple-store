import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Package, ShoppingBag, DollarSign, Plus, Pencil, Trash2, Image as ImageIcon, Download, ChevronDown, ChevronUp, CalendarIcon, BarChart3, Filter, Search } from "lucide-react";
import { ProductDialog } from "@/components/admin/ProductDialog";
import { CategoryDialog } from "@/components/admin/CategoryDialog";
import { BannerDialog } from "@/components/admin/BannerDialog";
import { BlogDialog } from "@/components/admin/BlogDialog";
import { SaleDialog } from "@/components/admin/SaleDialog";
import { MetaCatalogSync } from "@/components/admin/MetaCatalogSync";
import ReviewDialog from "@/components/admin/ReviewDialog";
import { OrderAnalytics } from "@/components/admin/OrderAnalytics";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/currency";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import * as XLSX from 'xlsx';

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [productDialog, setProductDialog] = useState({ open: false, product: null });
  const [categoryDialog, setCategoryDialog] = useState({ open: false, category: null });
  const [bannerDialog, setBannerDialog] = useState({ open: false, banner: null });
  const [blogDialog, setBlogDialog] = useState({ open: false, blog: null });
  const [reviewDialog, setReviewDialog] = useState({ open: false, review: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: "", id: "", name: "" });
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [exportDialog, setExportDialog] = useState(false);
  const [instaWorldDialog, setInstaWorldDialog] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [instaStartDate, setInstaStartDate] = useState<Date | undefined>(undefined);
  const [instaEndDate, setInstaEndDate] = useState<Date | undefined>(undefined);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editingNote, setEditingNote] = useState<{ orderId: string; note: string } | null>(null);
  const [editingCustomerConfirmation, setEditingCustomerConfirmation] = useState<{ orderId: string; confirmation: string } | null>(null);
  const [editingCourierCompany, setEditingCourierCompany] = useState<{ orderId: string; courier: string } | null>(null);
  const [editingAddress, setEditingAddress] = useState<{ orderId: string; address: string } | null>(null);
  const [exportStatusFilter, setExportStatusFilter] = useState<string>("all");
  const [instaStatusFilter, setInstaStatusFilter] = useState<string>("all");
  const [instaProductFilter, setInstaProductFilter] = useState<string>("all");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        checkAdminStatus(session.user.id);
      }
    });
  }, [navigate]);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    if (!data) {
      navigate('/');
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
    } else {
      setIsAdmin(true);
    }
  };

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*, product_variations(*)))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: banners } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const { data: blogs } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, products(name)')
        .order('review_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: "Order status updated" });
    },
  });

  const updateAdminNote = useMutation({
    mutationFn: async ({ orderId, note }: { orderId: string; note: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ admin_notes: note })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: "Note updated" });
      setEditingNote(null);
    },
  });

  const updateCustomerConfirmation = useMutation({
    mutationFn: async ({ orderId, confirmation }: { orderId: string; confirmation: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ customer_confirmation: confirmation })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: "Customer confirmation updated" });
      setEditingCustomerConfirmation(null);
    },
  });

  const updateCourierCompany = useMutation({
    mutationFn: async ({ orderId, courier }: { orderId: string; courier: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ courier_company: courier })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: "Courier company updated" });
      setEditingCourierCompany(null);
    },
  });

  const updateShippingAddress = useMutation({
    mutationFn: async ({ orderId, address }: { orderId: string; address: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ shipping_address: address })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: "Shipping address updated" });
      setEditingAddress(null);
    },
  });

  const deleteItem = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      const { error } = await supabase.from(type as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`admin-${variables.type}`] });
      queryClient.invalidateQueries({ queryKey: [variables.type] });
      toast({ title: `${variables.type.slice(0, -1)} deleted successfully` });
      setDeleteDialog({ open: false, type: "", id: "", name: "" });
    },
  });

  const handleDelete = () => {
    deleteItem.mutate({ type: deleteDialog.type, id: deleteDialog.id });
  };

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const exportOrdersToInstaWorld = (filterByDate: boolean = false) => {
    if (!orders || orders.length === 0) {
      toast({
        title: "No orders to export",
        description: "There are no orders available to download.",
        variant: "destructive",
      });
      return;
    }

    let filteredOrders = orders;
    
    // Apply status filter
    if (instaStatusFilter !== "all") {
      filteredOrders = filteredOrders.filter(order => order.status === instaStatusFilter);
    }
    
    // Apply product filter
    if (instaProductFilter !== "all") {
      filteredOrders = filteredOrders.filter(order => {
        const orderItems = order.order_items || [];
        return orderItems.some((item: any) => item.product_id === instaProductFilter);
      });
    }
    
    // Apply date filter
    if (filterByDate && instaStartDate && instaEndDate) {
      filteredOrders = filteredOrders.filter((order) => {
        const orderDate = new Date(order.created_at);
        const start = new Date(instaStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(instaEndDate);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
      });

      if (filteredOrders.length === 0) {
        toast({
          title: "No orders found",
          description: "No orders found in the selected date range.",
          variant: "destructive",
        });
        return;
      }
    }

    // Sort orders by order ID in ascending order
    filteredOrders = filteredOrders.sort((a, b) => a.order_number - b.order_number);

    // Create CSV data for INSTA WORLD
    const csvData = filteredOrders.flatMap((order) => {
      const orderItems = order.order_items || [];
      return orderItems.map((item: any) => {
        const product = products?.find(p => p.id === item.product_id);
        const variationInfo = item.variation_name ? ` - ${item.variation_name}` : '';
        const colorInfo = item.color_name ? ` - ${item.color_name}` : '';
        const itemTitle = `${product?.name || 'N/A'}${variationInfo}${colorInfo}`;
        
        return {
          ref_no: order.order_number,
          consignee_first_name: order.first_name,
          consignee_last_name: order.last_name,
          consignee_email: order.email || "",
          consignee_phone: order.phone,
          consignee_city: order.shipping_city,
          consignee_address: order.shipping_address,
          amount: order.total_amount,
          financial_status: "COD",
          remarks: order.admin_notes || order.notes || "",
          item_title: itemTitle,
          item_price: item.price,
          item_quantity: item.quantity,
          item_sku: product?.sku || "",
          item_kg: product?.weight_kg || "",
        };
      });
    });

    // Convert to CSV format
    const headers = [
      "ref_no", "consignee_first_name", "consignee_last_name", "consignee_email",
      "consignee_phone", "consignee_city", "consignee_address", "amount",
      "financial_status", "remarks", "item_title", "item_price",
      "item_quantity", "item_sku", "item_kg"
    ];

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => 
        headers.map(header => {
          let value = row[header as keyof typeof row]?.toString() || "";
          
          // Remove line breaks and carriage returns that break CSV format
          value = value.replace(/[\r\n]+/g, ' ').trim();
          
          // Escape quotes by doubling them
          value = value.replace(/"/g, '""');
          
          // Always wrap fields in quotes to prevent CSV issues
          return `"${value}"`;
        }).join(",")
      )
    ].join("\n");

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    
    const dateRangeStr = filterByDate && instaStartDate && instaEndDate 
      ? `_${format(instaStartDate, 'yyyy-MM-dd')}_to_${format(instaEndDate, 'yyyy-MM-dd')}`
      : '';
    const fileName = `insta_world_orders${dateRangeStr}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setInstaWorldDialog(false);
    setInstaStartDate(undefined);
    setInstaEndDate(undefined);
    setInstaStatusFilter("all");
    
    toast({
      title: "Export successful",
      description: `Downloaded ${filteredOrders.length} orders to ${fileName}`,
    });
  };

  const exportOrdersToExcel = (filterByDate: boolean = false) => {
    if (!orders || orders.length === 0) {
      toast({
        title: "No orders to export",
        description: "There are no orders available to download.",
        variant: "destructive",
      });
      return;
    }

    let filteredOrders = orders;
    
    // Apply status filter
    if (exportStatusFilter !== "all") {
      filteredOrders = filteredOrders.filter(order => order.status === exportStatusFilter);
    }
    
    // Apply date filter
    if (filterByDate && startDate && endDate) {
      filteredOrders = filteredOrders.filter((order) => {
        const orderDate = new Date(order.created_at);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
      });

      if (filteredOrders.length === 0) {
        toast({
          title: "No orders found",
          description: "No orders found in the selected date range.",
          variant: "destructive",
        });
        return;
      }
    }

    // Sort orders by order ID in ascending order
    filteredOrders = filteredOrders.sort((a, b) => a.order_number - b.order_number);

    // Create export data with exact sequence requested
    const exportData = filteredOrders.flatMap((order) => {
      return order.order_items?.map((item: any, index: number) => {
        const variationInfo = item.variation_name ? ` (${item.variation_name})` : '';
        const colorInfo = item.color_name ? ` (${item.color_name})` : '';
        return {
          'Order ID': order.order_number,
          'Order Date': format(new Date(order.created_at), 'PPP'),
          'Customer Name': `${order.first_name} ${order.last_name}`,
          'Email': order.email || 'N/A',
          'Customer Confirmation': order.customer_confirmation || 'N/A',
          'Phone Number': order.phone,
          'Address': order.shipping_address,
          'City': order.shipping_city,
          'Product Name': (item.products?.name || 'N/A') + variationInfo + colorInfo,
          'Quantity': item.quantity,
          'Price': item.price,
          'Item Total': item.price * item.quantity,
          'Order Total': index === 0 ? Number(order.total_amount) : '',
          'Status': order.status,
          'Notes': order.admin_notes || 'N/A',
          'Courier Company': order.courier_company || 'N/A',
        };
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    
    const dateRangeStr = filterByDate && startDate && endDate 
      ? `_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}`
      : '';
    const fileName = `orders${dateRangeStr}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Export successful",
      description: `Downloaded ${filteredOrders.length} orders to ${fileName}`,
    });
    
    setExportDialog(false);
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // Filter and search orders
  const filteredOrders = orders?.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesProduct = productFilter === "all" || order.order_items?.some((item: any) => item.product_id === productFilter);
    const matchesSearch = !searchQuery || 
      order.order_number.toString().includes(searchQuery) ||
      order.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery) ||
      order.order_items?.some((item: any) => 
        item.products?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesStatus && matchesProduct && matchesSearch;
  }) || [];

  const stats = {
    totalOrders: orders?.length || 0,
    totalProducts: products?.length || 0,
    totalRevenue: orders?.filter(order => order.status === 'delivered').reduce((sum, order) => sum + Number(order.total_amount), 0) || 0,
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <LoadingScreen message="Verifying admin access..." />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-4xl font-bold mb-8 text-center gold-accent pb-8">
            Admin Dashboard
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-3xl font-bold">{stats.totalOrders}</p>
                  </div>
                  <ShoppingBag className="h-12 w-12 text-accent" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="text-3xl font-bold">{stats.totalProducts}</p>
                  </div>
                  <Package className="h-12 w-12 text-accent" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-3xl font-bold">{formatPrice(stats.totalRevenue)}</p>
                  </div>
                  <DollarSign className="h-12 w-12 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="orders">
            <TabsList className="w-full flex flex-wrap gap-1 h-auto p-1">
              <TabsTrigger value="orders" className="text-xs md:text-sm flex-1 min-w-[80px]">Orders</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs md:text-sm flex-1 min-w-[80px]">Analytics</TabsTrigger>
              <TabsTrigger value="products" className="text-xs md:text-sm flex-1 min-w-[80px]">Products</TabsTrigger>
              <TabsTrigger value="categories" className="text-xs md:text-sm flex-1 min-w-[80px]">Categories</TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs md:text-sm flex-1 min-w-[80px]">Reviews</TabsTrigger>
              <TabsTrigger value="banners" className="text-xs md:text-sm flex-1 min-w-[80px]">Banners</TabsTrigger>
              <TabsTrigger value="blogs" className="text-xs md:text-sm flex-1 min-w-[80px]">Blogs</TabsTrigger>
              <TabsTrigger value="meta-catalog" className="text-xs md:text-sm flex-1 min-w-[100px]">Meta Catalog</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-4">
              <Card className="mb-4">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Search</label>
                      <input
                        type="text"
                        placeholder="Order ID, name, product..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Filter by Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Filter by Product</label>
                      <Select value={productFilter} onValueChange={setProductFilter}>
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
                    <div className="flex items-end gap-2">
                      <Button onClick={() => setExportDialog(true)} variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Export to Excel
                      </Button>
                      <Button onClick={() => setInstaWorldDialog(true)} className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        INSTA WORLD
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No orders match your filters
                </div>
              ) : null}
              
              {filteredOrders.map((order, index) => (
                <Collapsible 
                  key={order.id}
                  open={expandedOrders.has(order.id)}
                  onOpenChange={() => toggleOrderExpanded(order.id)}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto hover:bg-transparent w-full sm:w-auto justify-start">
                            <div className="text-left">
                              <CardTitle className="text-base sm:text-lg">Order #{order.order_number}</CardTitle>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {format(new Date(order.created_at), 'PPP')}
                              </p>
                            </div>
                            {expandedOrders.has(order.id) ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <Select
                          value={order.status}
                          onValueChange={(status) => updateOrderStatus.mutate({ orderId: order.id, status })}
                        >
                          <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {order.order_items?.map((item: any) => (
                          <div key={item.id} className="flex flex-col sm:flex-row justify-between gap-2 text-sm border-b pb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.products?.name}</span>
                                {item.variation_name && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.variation_name}
                                  </Badge>
                                )}
                                {item.color_name && (
                                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                                    {item.color_code && (
                                      <span 
                                        className="inline-block w-3 h-3 rounded-full border" 
                                        style={{ backgroundColor: item.color_code }}
                                      />
                                    )}
                                    {item.color_name}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-muted-foreground">Qty: {item.quantity}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/product/${item.products?.slug}`)}
                                className="h-8"
                              >
                                View Product
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between font-bold">
                          <span>Total</span>
                          <span className="text-accent">{formatPrice(Number(order.total_amount))}</span>
                        </div>
                      </div>

                      <CollapsibleContent className="mt-4 space-y-4">
                        <div className="border-t pt-4 space-y-3">
                          <h4 className="font-semibold text-sm">Customer Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Name:</span>
                              <p className="font-medium">{order.first_name} {order.last_name}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Email:</span>
                              <p className="font-medium">{order.email || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Phone:</span>
                              <p className="font-medium">{order.phone}</p>
                            </div>
                          </div>

                          <div className="pt-2">
                            <h4 className="font-semibold text-sm mb-2">Shipping Address</h4>
                            {editingAddress?.orderId === order.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingAddress.address}
                                  onChange={(e) => setEditingAddress({ orderId: order.id, address: e.target.value })}
                                  className="w-full px-3 py-2 border rounded-md text-sm"
                                  rows={3}
                                  placeholder="Enter shipping address..."
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateShippingAddress.mutate({ orderId: order.id, address: editingAddress.address })}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingAddress(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="text-sm space-y-1">
                                  <p>{order.shipping_address}</p>
                                  <p>{order.shipping_city}, {order.shipping_state} {order.shipping_zip}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingAddress({ orderId: order.id, address: order.shipping_address || '' })}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Edit Address
                                </Button>
                              </div>
                            )}
                          </div>

                          {order.notes && (
                            <>
                              <h4 className="font-semibold text-sm pt-2">Customer Notes</h4>
                              <p className="text-sm text-muted-foreground">{order.notes}</p>
                            </>
                          )}

                          <div className="pt-2">
                            <h4 className="font-semibold text-sm mb-2">Customer Confirmation</h4>
                            {editingCustomerConfirmation?.orderId === order.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editingCustomerConfirmation.confirmation}
                                  onChange={(e) => setEditingCustomerConfirmation({ orderId: order.id, confirmation: e.target.value })}
                                  className="w-full px-3 py-2 border rounded-md text-sm"
                                  placeholder="Add customer confirmation..."
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateCustomerConfirmation.mutate({ orderId: order.id, confirmation: editingCustomerConfirmation.confirmation })}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingCustomerConfirmation(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                  {order.customer_confirmation || 'No customer confirmation'}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingCustomerConfirmation({ orderId: order.id, confirmation: order.customer_confirmation || '' })}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="pt-2">
                            <h4 className="font-semibold text-sm mb-2">Courier Company</h4>
                            {editingCourierCompany?.orderId === order.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editingCourierCompany.courier}
                                  onChange={(e) => setEditingCourierCompany({ orderId: order.id, courier: e.target.value })}
                                  className="w-full px-3 py-2 border rounded-md text-sm"
                                  placeholder="Add courier company..."
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateCourierCompany.mutate({ orderId: order.id, courier: editingCourierCompany.courier })}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingCourierCompany(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                  {order.courier_company || 'No courier company'}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingCourierCompany({ orderId: order.id, courier: order.courier_company || '' })}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="pt-2">
                            <h4 className="font-semibold text-sm mb-2">Admin Notes</h4>
                            {editingNote?.orderId === order.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingNote.note}
                                  onChange={(e) => setEditingNote({ orderId: order.id, note: e.target.value })}
                                  className="w-full px-3 py-2 border rounded-md text-sm"
                                  rows={3}
                                  placeholder="Add admin notes..."
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateAdminNote.mutate({ orderId: order.id, note: editingNote.note })}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingNote(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                  {order.admin_notes || 'No admin notes'}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingNote({ orderId: order.id, note: order.admin_notes || '' })}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Edit Note
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="text-sm">
                            <span className="text-muted-foreground">Order ID:</span>
                            <p className="font-mono text-xs break-all">{order.id}</p>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </CardContent>
                  </Card>
                </Collapsible>
              ))}
            </TabsContent>

            <TabsContent value="analytics">
              <OrderAnalytics
                orders={orders || []}
                products={products || []}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
              />
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle>Products</CardTitle>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <SaleDialog />
                    <Button onClick={() => setProductDialog({ open: true, product: null })} className="flex-1 sm:flex-initial">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Add Product</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Name</TableHead>
                        <TableHead className="min-w-[80px]">SKU</TableHead>
                        <TableHead className="min-w-[100px]">Category</TableHead>
                        <TableHead className="min-w-[80px]">Price</TableHead>
                        <TableHead className="min-w-[60px]">Stock</TableHead>
                        <TableHead className="min-w-[80px]">Featured</TableHead>
                        <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products?.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{product.sku || "—"}</TableCell>
                          <TableCell>{product.categories?.name || "—"}</TableCell>
                          <TableCell>{formatPrice(product.price)}</TableCell>
                          <TableCell>{product.stock_quantity}</TableCell>
                          <TableCell>
                            {product.is_featured && <Badge variant="secondary">Featured</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setProductDialog({ open: true, product })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteDialog({ 
                                open: true, 
                                type: "products", 
                                id: product.id, 
                                name: product.name 
                              })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle>Categories</CardTitle>
                  <Button onClick={() => setCategoryDialog({ open: true, category: null })} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Category</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Name</TableHead>
                        <TableHead className="min-w-[120px]">Slug</TableHead>
                        <TableHead className="min-w-[150px]">Description</TableHead>
                        <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories?.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.slug}</TableCell>
                          <TableCell>{category.description || "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCategoryDialog({ open: true, category })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteDialog({ 
                                open: true, 
                                type: "categories", 
                                id: category.id, 
                                name: category.name 
                              })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle>Customer Reviews</CardTitle>
                  <Button onClick={() => setReviewDialog({ open: true, review: null })} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Review</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Product</TableHead>
                        <TableHead className="min-w-[120px]">Reviewer</TableHead>
                        <TableHead className="min-w-[80px]">Rating</TableHead>
                        <TableHead className="min-w-[150px]">Title</TableHead>
                        <TableHead className="min-w-[80px]">Verified</TableHead>
                        <TableHead className="min-w-[100px]">Date</TableHead>
                        <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviews?.map((review: any) => (
                        <TableRow key={review.id}>
                          <TableCell className="font-medium">{review.products?.name || 'N/A'}</TableCell>
                          <TableCell>{review.reviewer_name}</TableCell>
                          <TableCell>
                            <div className="flex gap-0.5">
                              {"⭐".repeat(review.rating)}
                            </div>
                          </TableCell>
                          <TableCell>{review.review_title}</TableCell>
                          <TableCell>
                            <Badge variant={review.is_verified ? "default" : "secondary"}>
                              {review.is_verified ? "Verified" : "Unverified"}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(review.review_date), 'PP')}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReviewDialog({ open: true, review })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteDialog({ 
                                open: true, 
                                type: "reviews", 
                                id: review.id, 
                                name: review.review_title 
                              })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banners">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle>Homepage Banners</CardTitle>
                  <Button onClick={() => setBannerDialog({ open: true, banner: null })} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Banner</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[80px]">Preview</TableHead>
                        <TableHead className="min-w-[150px]">Title</TableHead>
                        <TableHead className="min-w-[80px]">Sort Order</TableHead>
                        <TableHead className="min-w-[80px]">Status</TableHead>
                        <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {banners?.map((banner) => (
                        <TableRow key={banner.id}>
                          <TableCell>
                            {banner.image_url ? (
                              <img src={banner.image_url} alt={banner.title} className="h-12 w-20 object-cover rounded" />
                            ) : (
                              <div className="h-12 w-20 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{banner.title}</TableCell>
                          <TableCell>{banner.sort_order}</TableCell>
                          <TableCell>
                            <Badge variant={banner.active ? "default" : "secondary"}>
                              {banner.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBannerDialog({ open: true, banner })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteDialog({ 
                                open: true, 
                                type: "banners", 
                                id: banner.id, 
                                name: banner.title 
                              })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blogs">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle>Blog Posts</CardTitle>
                  <Button onClick={() => setBlogDialog({ open: true, blog: null })} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Blog Post</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Title</TableHead>
                        <TableHead className="min-w-[120px]">Slug</TableHead>
                        <TableHead className="min-w-[80px]">Status</TableHead>
                        <TableHead className="min-w-[120px]">Created</TableHead>
                        <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blogs?.map((blog) => (
                        <TableRow key={blog.id}>
                          <TableCell className="font-medium">{blog.title}</TableCell>
                          <TableCell className="text-xs">{blog.slug}</TableCell>
                          <TableCell>
                            <Badge variant={blog.published ? "default" : "secondary"}>
                              {blog.published ? "Published" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{format(new Date(blog.created_at), 'PP')}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBlogDialog({ open: true, blog })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteDialog({ 
                                open: true, 
                                type: "blogs", 
                                id: blog.id, 
                                name: blog.title 
                              })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="meta-catalog" className="space-y-4">
              <MetaCatalogSync />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      <ProductDialog
        open={productDialog.open}
        onOpenChange={(open) => setProductDialog({ open, product: null })}
        product={productDialog.product}
        categories={categories || []}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-products'] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }}
      />

      <CategoryDialog
        open={categoryDialog.open}
        onOpenChange={(open) => setCategoryDialog({ open, category: null })}
        category={categoryDialog.category}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['categories'] });
        }}
      />

      <BannerDialog
        open={bannerDialog.open}
        onOpenChange={(open) => setBannerDialog({ open, banner: null })}
        banner={bannerDialog.banner}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
          queryClient.invalidateQueries({ queryKey: ['banners'] });
        }}
      />

      <BlogDialog
        open={blogDialog.open}
        onOpenChange={(open) => setBlogDialog({ open, blog: null })}
        blog={blogDialog.blog}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
        }}
      />

      <ReviewDialog
        open={reviewDialog.open}
        onOpenChange={(open) => setReviewDialog({ open, review: null })}
        review={reviewDialog.review}
        products={products || []}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
        }}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, type: "", id: "", name: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteDialog.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={exportDialog} onOpenChange={setExportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export Orders to Excel</AlertDialogTitle>
            <AlertDialogDescription>
              Choose to export all orders or filter by date range and status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Status</label>
              <Select value={exportStatusFilter} onValueChange={setExportStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date (Optional)</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date (Optional)</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={() => exportOrdersToExcel(false)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Export All Orders
            </Button>
            <Button
              onClick={() => exportOrdersToExcel(true)}
              disabled={!startDate || !endDate}
              className="w-full sm:w-auto"
            >
              Export Filtered Orders
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* INSTA WORLD Export Dialog */}
      <AlertDialog 
        open={instaWorldDialog} 
        onOpenChange={(open) => {
          setInstaWorldDialog(open);
          if (!open) {
            setInstaStatusFilter("all");
            setInstaProductFilter("all");
            setInstaStartDate(undefined);
            setInstaEndDate(undefined);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export Orders for INSTA WORLD</AlertDialogTitle>
            <AlertDialogDescription>
              Choose to export all orders or filter by status and date range. File will be in CSV format.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Status</label>
              <Select value={instaStatusFilter} onValueChange={setInstaStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Product</label>
              <Select value={instaProductFilter} onValueChange={setInstaProductFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date (Optional)</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {instaStartDate ? format(instaStartDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={instaStartDate}
                      onSelect={setInstaStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date (Optional)</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {instaEndDate ? format(instaEndDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={instaEndDate}
                      onSelect={setInstaEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={() => exportOrdersToInstaWorld(false)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Export All Orders
            </Button>
            <Button
              onClick={() => exportOrdersToInstaWorld(true)}
              disabled={!instaStartDate || !instaEndDate}
              className="w-full sm:w-auto"
            >
              Export Filtered Orders
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;