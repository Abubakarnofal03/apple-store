import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ImageUpload } from "./ImageUpload";

interface Review {
  id: string;
  product_id: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  is_verified: boolean;
  rating: number;
  review_title: string;
  review_text: string;
  review_images: string[];
  review_date: string;
}

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review?: Review | null;
  products: any[];
  onSuccess: () => void;
}

export default function ReviewDialog({ open, onOpenChange, review, products, onSuccess }: ReviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    reviewer_name: "",
    reviewer_avatar: "",
    is_verified: false,
    rating: 5,
    review_title: "",
    review_text: "",
    review_images: [] as string[],
    review_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (review) {
      setFormData({
        product_id: review.product_id,
        reviewer_name: review.reviewer_name,
        reviewer_avatar: review.reviewer_avatar || "",
        is_verified: review.is_verified,
        rating: review.rating,
        review_title: review.review_title,
        review_text: review.review_text,
        review_images: review.review_images || [],
        review_date: review.review_date.split('T')[0],
      });
    } else {
      setFormData({
        product_id: "",
        reviewer_name: "",
        reviewer_avatar: "",
        is_verified: false,
        rating: 5,
        review_title: "",
        review_text: "",
        review_images: [],
        review_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [review]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reviewData = {
        product_id: formData.product_id,
        reviewer_name: formData.reviewer_name,
        reviewer_avatar: formData.reviewer_avatar || null,
        is_verified: formData.is_verified,
        rating: formData.rating,
        review_title: formData.review_title,
        review_text: formData.review_text,
        review_images: formData.review_images,
        review_date: new Date(formData.review_date).toISOString(),
      };

      if (review) {
        const { error } = await supabase
          .from("reviews")
          .update(reviewData)
          .eq("id", review.id);

        if (error) throw error;
        toast({ title: "Review updated successfully" });
      } else {
        const { error } = await supabase
          .from("reviews")
          .insert([reviewData]);

        if (error) throw error;
        toast({ title: "Review added successfully" });
      }

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
          <DialogTitle>{review ? "Edit Review" : "Add Review"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product_id">Product *</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reviewer_name">Reviewer Name *</Label>
            <Input
              id="reviewer_name"
              value={formData.reviewer_name}
              onChange={(e) => setFormData({ ...formData, reviewer_name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="reviewer_avatar">Reviewer Avatar URL (optional)</Label>
            <ImageUpload
              label=""
              value={formData.reviewer_avatar}
              onChange={(url) => setFormData({ ...formData, reviewer_avatar: typeof url === 'string' ? url : '' })}
              folder="avatars"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_verified"
              checked={formData.is_verified}
              onCheckedChange={(checked) => setFormData({ ...formData, is_verified: checked })}
            />
            <Label htmlFor="is_verified">Verified Buyer</Label>
          </div>

          <div>
            <Label htmlFor="rating">Rating *</Label>
            <Select
              value={formData.rating.toString()}
              onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <SelectItem key={rating} value={rating.toString()}>
                    {"⭐".repeat(rating)} ({rating})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="review_title">Review Title *</Label>
            <Input
              id="review_title"
              value={formData.review_title}
              onChange={(e) => setFormData({ ...formData, review_title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="review_text">Review Text *</Label>
            <Textarea
              id="review_text"
              value={formData.review_text}
              onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="review_date">Review Date *</Label>
            <Input
              id="review_date"
              type="date"
              value={formData.review_date}
              onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Review Images (optional)</Label>
            <ImageUpload
              label=""
              value={formData.review_images}
              onChange={(urls) => {
                if (Array.isArray(urls)) {
                  setFormData({ ...formData, review_images: urls });
                }
              }}
              multiple={true}
              folder="reviews"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : review ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
