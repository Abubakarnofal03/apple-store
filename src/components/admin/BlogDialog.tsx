import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "./ImageUpload";

interface BlogDialogProps {
  blog?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const BlogDialog = ({ blog, open, onOpenChange, onSuccess }: BlogDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    meta_title: "",
    meta_description: "",
    focus_keywords: "",
    featured_image_url: "",
    published: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title || "",
        slug: blog.slug || "",
        content: blog.content || "",
        excerpt: blog.excerpt || "",
        meta_title: blog.meta_title || "",
        meta_description: blog.meta_description || "",
        focus_keywords: blog.focus_keywords?.join(", ") || "",
        featured_image_url: blog.featured_image_url || "",
        published: blog.published || false,
      });
    } else {
      setFormData({
        title: "",
        slug: "",
        content: "",
        excerpt: "",
        meta_title: "",
        meta_description: "",
        focus_keywords: "",
        featured_image_url: "",
        published: false,
      });
    }
  }, [blog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const blogData = {
        ...formData,
        focus_keywords: formData.focus_keywords.split(",").map(k => k.trim()).filter(Boolean),
        slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      };

      if (blog) {
        const { error } = await supabase
          .from("blogs")
          .update(blogData)
          .eq("id", blog.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("blogs")
          .insert([blogData]);
        if (error) throw error;
      }

      toast({
        title: blog ? "Blog updated" : "Blog created",
        description: "Blog post has been saved successfully.",
      });
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{blog ? "Edit Blog Post" : "Create Blog Post"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="slug">Slug (URL-friendly name)</Label>
            <Input
              id="slug"
              placeholder="auto-generated-from-title"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              rows={2}
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="content">Content (HTML supported) *</Label>
            <Textarea
              id="content"
              required
              rows={8}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div>
            <Label>Featured Image URL</Label>
            <Input
              placeholder="https://example.com/image.jpg or upload via Products section"
              value={formData.featured_image_url}
              onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">SEO Settings</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  placeholder="SEO title (max 60 characters)"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  maxLength={60}
                />
              </div>

              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  placeholder="SEO description (max 160 characters)"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  maxLength={160}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="focus_keywords">Focus Keywords (comma-separated)</Label>
                <Input
                  id="focus_keywords"
                  placeholder="keyword1, keyword2, keyword3"
                  value={formData.focus_keywords}
                  onChange={(e) => setFormData({ ...formData, focus_keywords: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={formData.published}
              onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
            />
            <Label htmlFor="published">Published</Label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : blog ? "Update" : "Create"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
