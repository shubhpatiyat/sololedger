import React, { useRef, useState } from "react";
import { Paperclip, X, File as FileIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  KNOWLEDGE_BASE_FILE_EXTENSIONS_SUPPORTED,
  MAX_FILE_SIZE_MB,
} from "@/constant/fileExtensions";
import { useToast } from "@/hooks/use-toast";

interface FileAttachmentButtonProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  onClick?: () => void;
}

export const FileAttachmentButton: React.FC<FileAttachmentButtonProps> = ({
  onFileSelect,
  disabled,
  onClick,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size must be less than ${MAX_FILE_SIZE_MB}MB`,
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate extension
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!KNOWLEDGE_BASE_FILE_EXTENSIONS_SUPPORTED.includes(extension)) {
      toast({
        title: "Unsupported file type",
        description: `Supported formats: ${KNOWLEDGE_BASE_FILE_EXTENSIONS_SUPPORTED.join(
          ", "
        )}`,
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    onFileSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept={KNOWLEDGE_BASE_FILE_EXTENSIONS_SUPPORTED.join(",")}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-8 h-8 p-0"
        onClick={() => {
          onClick?.();
          fileInputRef.current?.click();
        }}
        disabled={disabled}
        title="Attach file"
      >
        <Paperclip className="w-4 h-4" />
      </Button>
    </>
  );
};

interface FilePreviewProps {
  file: File;
  progress?: number;
  onRemove: () => void;
  uploading?: boolean;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  progress = 0,
  onRemove,
  uploading,
}) => {
  const isImage = file.type.startsWith("image/");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  return (
    <div className="relative group flex items-center gap-2 p-2 bg-muted/50 rounded-lg max-w-[200px] mb-2">
      <div className="relative w-10 h-10 flex-shrink-0 bg-background rounded overflow-hidden flex items-center justify-center border">
        {isImage && previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <FileIcon className="w-5 h-5 text-muted-foreground" />
        )}

        {/* Progress Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            {/* Circular Progress (using simple SVG or just spinner + text) */}
            <div className="relative w-6 h-6">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-muted stroke-current"
                  strokeWidth="10"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                ></circle>
                <circle
                  className="text-primary stroke-current transition-all duration-300 ease-in-out"
                  strokeWidth="10"
                  strokeLinecap="round"
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * progress) / 100}
                  transform="rotate(-90 50 50)"
                ></circle>
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{file.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-black/90"
        disabled={uploading}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
