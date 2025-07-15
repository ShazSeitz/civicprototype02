import { useState, useEffect } from 'react';
import { TestMappingForm } from '@/components/TestMappingForm';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OpenAIService } from '@/services/openai-service';

export default function TestMapping() {
  const [apiKey, setApiKey] = useState('');
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  
  const openAIService = new OpenAIService();
  
  // Check if API key is stored in localStorage on component mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('openai_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsApiConfigured(true);
      openAIService.setApiKey(storedApiKey);
    }
  }, []);
  
  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey);
      setIsApiConfigured(true);
      openAIService.setApiKey(apiKey);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Priority-to-Policy Mapping Testx</h1>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {isApiConfigured ? 'API Configured' : 'Configure API'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>OpenAI API Configuration</DialogTitle>
              <DialogDescription>
                Enter your OpenAI API key to enable advanced priority mapping.
                The key will be stored in your browser's local storage.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiKey" className="text-right">
                  API Key
                </Label>
                <Input
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveApiKey}>Save API Key</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <p className="text-muted-foreground mb-8">
        This page demonstrates the core priority-to-policy mapping functionality.
        Enter a priority or click one of the test cases to see how it maps to policy terms.
        {!isApiConfigured && (
          <span className="block mt-2 text-amber-600">
            ⚠️ For best results, configure your OpenAI API key using the "Configure API" button above.
          </span>
        )}
      </p>
      
      <TestMappingForm />
    </div>
  );
}
