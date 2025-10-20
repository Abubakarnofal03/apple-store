import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "./ImageUpload";
import { VideoUpload } from "./VideoUpload";
import { VariationManager, Variation } from "./VariationManager";
import { ColorManager, Color } from "./ColorManager";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
  categories: any[];
  onSuccess: () => void;
}

export function ProductDialog({ open, onOpenChange, product, categories, onSuccess }: ProductDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    stock_quantity: "",
    category_id: "",
    sku: "",
    images: [] as string[],
    video_url: "",
    is_featured: false,
    shipping_cost: "",
    weight_kg: "",
  });
  const [variations, setVariations] = useState<Variation[]>([]);
  const [colors, setColors] = useState<Color[]>([]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        stock_quantity: product.stock_quantity?.toString() || "",
        category_id: product.category_id || "",
        sku: product.sku || "",
        images: product.images || [],
        video_url: product.video_url || "",
        is_featured: product.is_featured || false,
        shipping_cost: product.shipping_cost?.toString() || "",
        weight_kg: product.weight_kg?.toString() || "",
      });
      
      // Fetch variations if editing
      if (product.id) {
        supabase
          .from("product_variations")
          .select("*")
          .eq("product_id", product.id)
          .order("sort_order")
          .then(({ data }) => {
            if (data) {
              setVariations(data.map(v => ({
                id: v.id,
                name: v.name,
                price: v.price.toString(),
                quantity: v.quantity?.toString() || "0",
                sort_order: v.sort_order,
                apply_sale: v.apply_sale ?? true,
              })));
            }
          });

        // Fetch colors if editing
        supabase
          .from("product_colors")
          .select("*")
          .eq("product_id", product.id)
          .order("sort_order")
          .then(({ data }) => {
            if (data) {
              setColors(data.map(c => ({
                id: c.id,
                name: c.name,
                color_code: c.color_code,
                price: c.price ? c.price.toString() : "",
                quantity: c.quantity.toString(),
                sort_order: c.sort_order,
                apply_sale: c.apply_sale ?? true,
              })));
            }
          });
      }
    } else {
      setFormData({
        name: "",
        slug: "",
        description: "",
        price: "",
        stock_quantity: "",
        category_id: "",
        sku: "",
        images: [],
        video_url: "",
        is_featured: false,
        shipping_cost: "",
        weight_kg: "",
      });
      setVariations([]);
      setColors([]);
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        category_id: formData.category_id || null,
        sku: formData.sku || null,
        images: formData.images,
        video_url: formData.video_url || null,
        is_featured: formData.is_featured,
        shipping_cost: parseFloat(formData.shipping_cost) || 0,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
      };

      let productId: string;

      if (product) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);
        if (error) throw error;
        productId = product.id;
        
        // Delete existing variations and colors
        await supabase
          .from("product_variations")
          .delete()
          .eq("product_id", productId);
        
        await supabase
          .from("product_colors")
          .delete()
          .eq("product_id", productId);
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert([productData])
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // Insert variations if any
      if (variations.length > 0) {
        const variationsData = variations
          .filter(v => v.name && v.price)
          .map((v, index) => ({
            product_id: productId,
            name: v.name,
            price: parseFloat(v.price),
            quantity: parseInt(v.quantity) || 0,
            sort_order: index,
            apply_sale: v.apply_sale,
          }));
        
        if (variationsData.length > 0) {
          const { error: varError } = await supabase
            .from("product_variations")
            .insert(variationsData);
          if (varError) throw varError;
        }
      }

      // Insert colors if any
      if (colors.length > 0) {
        const colorsData = colors
          .filter(c => c.name && c.color_code)
          .map((c, index) => ({
            product_id: productId,
            name: c.name,
            color_code: c.color_code,
            price: c.price && parseFloat(c.price) > 0 ? parseFloat(c.price) : null,
            quantity: parseInt(c.quantity) || 0,
            sort_order: index,
            apply_sale: c.apply_sale,
          }));
        
        if (colorsData.length > 0) {
          const { error: colorError } = await supabase
            .from("product_colors")
            .insert(colorsData);
          if (colorError) throw colorError;
        }
      }

      toast({ title: product ? "Product updated successfully" : "Product created successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping">Shipping Cost *</Label>
              <Input
                id="shipping"
                type="number"
                step="0.01"
                value={formData.shipping_cost}
                onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight_kg">Weight (kg)</Label>
              <Input
                id="weight_kg"
                type="number"
                step="0.01"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ImageUpload
            label="Product Images"
            value={formData.images}
            onChange={(value) => setFormData({ ...formData, images: value as string[] })}
            multiple={true}
            folder="products"
          />

          <VideoUpload
            label="Product Video (Optional)"
            value={formData.video_url}
            onChange={(value) => setFormData({ ...formData, video_url: value })}
            folder="products"
          />

          <VariationManager
            variations={variations}
            onChange={setVariations}
          />

          <ColorManager
            colors={colors}
            onChange={setColors}
          />

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="featured"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              className="rounded border-input"
            />
            <Label htmlFor="featured">Featured Product</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : product ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}