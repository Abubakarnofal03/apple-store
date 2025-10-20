import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2, Video } from "lucide-react";

interface VideoUploadProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  folder: "products" | "categories" | "banners";
}

export function VideoUpload({ label, value, onChange, folder }: VideoUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadVideo = async (file: File): Promise<string | null> => {
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
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const url = await uploadVideo(file);
      if (url) {
        onChange(url);
        toast({ title: "Video uploaded successfully" });
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeVideo = async () => {
    try {
      if (value) {
        const url = new URL(value);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(pathParts.indexOf('store-images') + 1).join('/');

        if (filePath) {
          await supabase.storage.from('store-images').remove([filePath]);
        }
      }

      onChange('');
      toast({ title: "Video removed" });
    } catch (error: any) {
      toast({
        title: "Failed to remove video",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {value && (
        <div className="relative group mb-2">
          <video 
            src={value} 
            controls
            className="w-full h-48 rounded border bg-muted"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
            onClick={removeVideo}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById(`video-upload-${folder}`)?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Video className="mr-2 h-4 w-4" />
              Upload Video
            </>
          )}
        </Button>
        <input
          id={`video-upload-${folder}`}
          type="file"
          accept="video/mp4,video/webm,video/ogg"
          onChange={handleFileChange}
          className="hidden"
        />
        <span className="text-sm text-muted-foreground">
          Max 50MB • MP4, WebM, OGG
        </span>
      </div>
    </div>
  );
}
