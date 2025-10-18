import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "./ImageUpload";

interface BannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: any;
  onSuccess: () => void;
}

export function BannerDialog({ open, onOpenChange, banner, onSuccess }: BannerDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "",
    sort_order: "0",
    active: true,
    show_text_overlay: true,
  });

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title || "",
        subtitle: banner.subtitle || "",
        image_url: banner.image_url || "",
        link_url: banner.link_url || "",
        sort_order: banner.sort_order?.toString() || "0",
        active: banner.active ?? true,
        show_text_overlay: banner.show_text_overlay ?? true,
      });
    } else {
      setFormData({
        title: "",
        subtitle: "",
        image_url: "",
        link_url: "",
        sort_order: "0",
        active: true,
        show_text_overlay: true,
      });
    }
  }, [banner, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bannerData = {
        ...formData,
        sort_order: parseInt(formData.sort_order),
      };

      if (banner) {
        const { error } = await supabase
          .from("banners")
          .update(bannerData)
          .eq("id", banner.id);
        if (error) throw error;
        toast({ title: "Banner updated successfully" });
      } else {
        const { error } = await supabase
          .from("banners")
          .insert([bannerData]);
        if (error) throw error;
        toast({ title: "Banner created successfully" });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{banner ? "Edit Banner" : "Add New Banner"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            />
          </div>

          <ImageUpload
            label="Banner Image *"
            value={formData.image_url}
            onChange={(value) => setFormData({ ...formData, image_url: value as string })}
            multiple={false}
            folder="banners"
          />

          <div className="space-y-2">
            <Label htmlFor="link">Link URL</Label>
            <Input
              id="link"
              value={formData.link_url}
              onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              placeholder="/shop or https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Sort Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-input"
            />
            <Label htmlFor="active">Active</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show_text_overlay"
              checked={formData.show_text_overlay}
              onChange={(e) => setFormData({ ...formData, show_text_overlay: e.target.checked })}
              className="rounded border-input"
            />
            <Label htmlFor="show_text_overlay">Show Text Overlay</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : banner ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}