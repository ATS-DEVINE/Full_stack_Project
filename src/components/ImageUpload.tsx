import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { friendlyError } from "@/lib/errors";

interface ImageUploadProps {
  bucket: string;
  folder: string;
  onUploaded: (url: string) => void;
  currentUrl?: string | null;
  className?: string;
  label?: string;
  accept?: string;
  size?: "sm" | "lg";
}

export default function ImageUpload({ bucket, folder, onUploaded, currentUrl, className = "", label = "Upload Image", accept = "image/*", size = "sm" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: friendlyError(error), variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    setPreview(publicUrl);
    onUploaded(publicUrl);
    setUploading(false);
  };

  const remove = () => {
    setPreview(null);
    onUploaded("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={className}>
      {preview ? (
        <div className={`relative ${size === "lg" ? "h-32 w-full" : "h-20 w-20"} overflow-hidden rounded-lg border border-border`}>
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          <button onClick={remove} className="absolute right-1 top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`flex ${size === "lg" ? "h-32 w-full" : "h-20 w-20"} items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 transition-colors hover:border-primary hover:bg-muted`}
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
            <div className="flex flex-col items-center gap-1">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={upload} />
    </div>
  );
}

interface MultiImageUploadProps {
  bucket: string;
  folder: string;
  images: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export function MultiImageUpload({ bucket, folder, images, onChange, max = 5 }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= max) {
      toast({ title: "Limit reached", description: `Max ${max} images allowed.`, variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: friendlyError(error), variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    onChange([...images, publicUrl]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {images.map((url, i) => (
        <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
          <img src={url} alt={`Product ${i + 1}`} className="h-full w-full object-cover" />
          <button onClick={() => remove(i)} className="absolute right-1 top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {images.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 transition-colors hover:border-primary hover:bg-muted"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
            <div className="flex flex-col items-center gap-1">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Add</span>
            </div>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={upload} />
    </div>
  );
}
