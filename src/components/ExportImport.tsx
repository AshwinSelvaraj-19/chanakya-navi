import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportImportProps {
  graphData: any;
  onImport: (data: any) => void;
}

const ExportImport: React.FC<ExportImportProps> = ({ graphData, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExport = () => {
    if (!graphData) {
      toast({
        title: "No Data",
        description: "No graph data available to export",
        variant: "destructive"
      });
      return;
    }

    const dataStr = JSON.stringify(graphData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `campus-graph-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: "Campus graph data has been downloaded"
    });
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate data structure
        if (!data.nodes || !Array.isArray(data.nodes) || 
            !data.edges || !Array.isArray(data.edges)) {
          throw new Error('Invalid data structure');
        }

        onImport(data);
        toast({
          title: "Import Successful",
          description: "Campus graph data has been loaded"
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid JSON file format",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        onClick={handleExport}
        className="w-full"
        disabled={!graphData}
      >
        <Download className="h-4 w-4 mr-2" />
        Export Graph
      </Button>
      
      <Button
        variant="outline"
        onClick={handleImport}
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        Import Graph
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ExportImport;