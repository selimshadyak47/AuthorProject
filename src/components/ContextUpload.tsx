import { useState } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

interface ContextUploadProps {
  onContextUpdate: (context: string) => void;
}

export function ContextUpload({ onContextUpdate }: ContextUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extractedContent, setExtractedContent] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const allowedTypes = ['text/plain', 'application/pdf'];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a .txt or .pdf file only.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size must be less than 5MB.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const content = await extractTextFromFile(file);
      setUploadedFiles([file]);
      setExtractedContent(content);
      onContextUpdate(content);
    } catch (error) {
      console.error('File processing error:', error);
      setError('Failed to process file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const result = e.target?.result;
          if (!result) {
            reject(new Error('Failed to read file'));
            return;
          }
          
          if (file.type === 'text/plain') {
            resolve(result as string);
          } else if (file.type === 'application/pdf') {
            // For PDF files, we'll use a simple text extraction
            // In a real implementation, you'd use a PDF parsing library
            const text = await extractTextFromPDF(result as ArrayBuffer);
            resolve(text);
          } else {
            reject(new Error('Unsupported file type'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    // Simple PDF text extraction - in a real app you'd use pdf-parse or similar
    // For now, we'll return a placeholder
    return `[PDF Content Extracted - ${new Date().toLocaleString()}]\n\nNote: This is a placeholder for PDF text extraction. In a production environment, you would integrate a proper PDF parsing library like pdf-parse to extract the actual text content from the uploaded PDF file.`;
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    if (newFiles.length === 0) {
      setExtractedContent("");
      onContextUpdate("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Context Guidelines</CardTitle>
        <CardDescription>
          Upload a text file with specific guidelines for Claude to follow when generating letters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Upload Context File</Label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="contextFile"
                accept=".txt,.pdf"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('contextFile')?.click()}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Upload File'}
              </Button>
              <span className="text-xs text-muted-foreground">
                Supports .txt, .pdf files (max 5MB)
              </span>
            </div>
          </div>

          {/* Uploaded Files Display */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Files:</Label>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Content Preview */}
          {extractedContent && (
            <div className="space-y-2">
              <Label>Extracted Content Preview:</Label>
              <div className="max-h-40 overflow-y-auto p-3 bg-muted/30 rounded text-sm">
                <pre className="whitespace-pre-wrap">{extractedContent.substring(0, 500)}</pre>
                {extractedContent.length > 500 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ... and {extractedContent.length - 500} more characters
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
