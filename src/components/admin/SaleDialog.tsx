import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag, Trash2 } from "lucide-react";

export const SaleDialog = () => {
  const [open, setOpen] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);
  const [productId, setProductId] = useState<string>("");
  const [discountPercentage, setDiscountPercentage] = useState("10");
  const [endDate, setEndDate] = useState("");
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
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
        .select('*, products(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveSale = useMutation({
    mutationFn: async () => {
      if (editingSaleId) {
        const { error } = await supabase.from('sales').update({
          product_id: isGlobal ? null : productId,
          discount_percentage: parseFloat(discountPercentage),
          end_date: new Date(endDate).toISOString(),
          is_global: isGlobal,
        }).eq('id', editingSaleId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sales').insert({
          product_id: isGlobal ? null : productId,
          discount_percentage: parseFloat(discountPercentage),
          end_date: new Date(endDate).toISOString(),
          is_global: isGlobal,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['active-global-sale'] });
      toast({ title: editingSaleId ? "Sale updated successfully" : "Sale created successfully" });
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: editingSaleId ? "Failed to update sale" : "Failed to create sale", variant: "destructive" });
    },
  });

  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['active-global-sale'] });
      toast({ title: "Sale deleted successfully" });
    },
  });

  const resetForm = () => {
    setIsGlobal(false);
    setProductId("");
    setDiscountPercentage("10");
    setEndDate("");
    setEditingSaleId(null);
  };

  const handleEdit = (sale: any) => {
    setEditingSaleId(sale.id);
    setIsGlobal(sale.is_global);
    setProductId(sale.product_id || "");
    setDiscountPercentage(sale.discount_percentage.toString());
    setEndDate(new Date(sale.end_date).toISOString().slice(0, 16));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGlobal && !productId) {
      toast({ title: "Please select a product", variant: "destructive" });
      return;
    }
    if (!endDate) {
      toast({ title: "Please select an end date", variant: "destructive" });
      return;
    }
    saveSale.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Tag className="h-4 w-4" />
          Manage Sales
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingSaleId ? 'Edit Sale' : 'Manage Sales'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch checked={isGlobal} onCheckedChange={setIsGlobal} id="global" />
            <Label htmlFor="global">Apply to all products</Label>
          </div>

          {!isGlobal && (
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="discount">Discount Percentage (%)</Label>
            <Input
              id="discount"
              type="number"
              min="1"
              max="100"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date & Time</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={saveSale.isPending}>
              {saveSale.isPending ? (editingSaleId ? "Updating..." : "Creating...") : (editingSaleId ? "Update Sale" : "Create Sale")}
            </Button>
            {editingSaleId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel Edit
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6 space-y-2">
          <h3 className="font-semibold">Active Sales</h3>
          {sales?.map((sale) => (
            <div key={sale.id} className="flex items-center justify-between p-3 glass-card rounded-lg hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => handleEdit(sale)}>
              <div className="flex-1">
                <p className="font-medium">
                  {sale.is_global ? "Global Sale" : sale.products?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {sale.discount_percentage}% off - Ends: {new Date(sale.end_date).toLocaleString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSale.mutate(sale.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {(!sales || sales.length === 0) && (
            <p className="text-sm text-muted-foreground">No active sales</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
