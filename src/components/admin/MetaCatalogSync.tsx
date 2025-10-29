import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

export const MetaCatalogSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<{ timestamp: Date; success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsLoading(true);
    
    try {
      console.log('Initiating Meta Catalog sync...');
      
      const { data, error } = await supabase.functions.invoke('sync-meta-catalog', {
        body: {},
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Sync response:', data);

      if (data.success) {
        setLastSync({
          timestamp: new Date(),
          success: true,
          message: data.message || `Synced ${data.synced} of ${data.total} products`,
        });
        
        toast({
          title: "Sync Successful",
          description: data.message,
        });
      } else {
        throw new Error(data.error || 'Sync failed');
      }

    } catch (error: any) {
      console.error('Sync error:', error);
      
      setLastSync({
        timestamp: new Date(),
        success: false,
        message: error.message || 'Failed to sync products',
      });
      
      toast({
        title: "Sync Failed",
        description: error.message || 'Failed to sync products to Meta Catalog',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Meta Catalog Sync
        </CardTitle>
        <CardDescription>
          Sync your products to Meta Commerce Manager for Facebook and Instagram shopping
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={handleSync} 
            disabled={isLoading}
            size="lg"
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            asChild
          >
            <a 
              href="https://business.facebook.com/commerce/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center"
            >
              Open Commerce Manager
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>

        {lastSync && (
          <Alert variant={lastSync.success ? "default" : "destructive"}>
            <div className="flex items-start gap-2">
              {lastSync.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <div className="flex-1">
                <AlertDescription>
                  <div className="font-semibold mb-1">
                    {lastSync.success ? 'Last Sync Successful' : 'Last Sync Failed'}
                  </div>
                  <div className="text-sm">{lastSync.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(lastSync.timestamp, 'PPp')}
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <div className="border-t pt-4 space-y-2 text-sm text-muted-foreground">
          <h4 className="font-semibold text-foreground">How it works:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Products are synced to your Meta Commerce Catalog</li>
            <li>Updates product availability based on stock quantity</li>
            <li>Uses product images, prices, and descriptions from your store</li>
            <li>Products will appear in Facebook and Instagram shopping</li>
          </ul>
        </div>

        <div className="border-t pt-4 space-y-2 text-sm">
          <h4 className="font-semibold">Configuration:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-muted-foreground">Store Domain:</div>
            <div className="font-mono">techspotuae.store</div>
            <div className="text-muted-foreground">Brand Name:</div>
            <div>tech spot uae</div>
            <div className="text-muted-foreground">Currency:</div>
            <div>AED</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
