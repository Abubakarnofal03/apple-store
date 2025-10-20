import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  label: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  folder: "products" | "categories" | "banners" | "avatars" | "reviews";
}

export function ImageUpload({ label, value, onChange, multiple = false, folder }: ImageUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      const fileName = `${folder}/${generateUUID()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('store-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('store-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      if (multiple) {
        const uploadPromises = Array.from(files).map(file => uploadImage(file));
        const urls = await Promise.all(uploadPromises);
        const validUrls = urls.filter(url => url !== null) as string[];
        
        if (validUrls.length > 0) {
          const currentValues = Array.isArray(value) ? value : [];
          onChange([...currentValues, ...validUrls]);
          toast({ title: `${validUrls.length} image(s) uploaded successfully` });
        }
      } else {
        const url = await uploadImage(files[0]);
        if (url) {
          onChange(url);
          toast({ title: "Image uploaded successfully" });
        }
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = async (urlToRemove: string) => {
    try {
      // Extract file path from URL
      const url = new URL(urlToRemove);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(pathParts.indexOf('store-images') + 1).join('/');

      if (filePath) {
        await supabase.storage.from('store-images').remove([filePath]);
      }

      if (multiple && Array.isArray(value)) {
        onChange(value.filter(url => url !== urlToRemove));
      } else {
        onChange('');
      }

      toast({ title: "Image removed" });
    } catch (error: any) {
      toast({
        title: "Failed to remove image",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const images = multiple ? (Array.isArray(value) ? value : []) : (value ? [value as string] : []);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className="grid grid-cols-2 gap-2 mb-2">
        {images.map((url, index) => (
          <div key={index} className="relative group">
            <img 
              src={url} 
              alt={`Upload ${index + 1}`}
              className="w-full h-32 object-cover rounded border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
              onClick={() => removeImage(url)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById(`file-upload-${folder}-${multiple}`)?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload {multiple ? "Images" : "Image"}
            </>
          )}
        </Button>
        <input
          id={`file-upload-${folder}-${multiple}`}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />
        <span className="text-sm text-muted-foreground">
          Max 5MB per image
        </span>
      </div>
    </div>
  );
}
