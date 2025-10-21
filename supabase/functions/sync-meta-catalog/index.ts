import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const metaAccessToken = Deno.env.get('META_ACCESS_TOKEN');
    const metaCatalogId = Deno.env.get('META_CATALOG_ID');

    if (!metaAccessToken || !metaCatalogId) {
      throw new Error('META_ACCESS_TOKEN or META_CATALOG_ID not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching products from database...');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, description, price, stock_quantity, images, categories(name)')
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      throw productsError;
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No products to sync',
          synced: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${products.length} products to sync`);

    const requests = products.map((product: any) => ({
      method: 'UPDATE',
      retailer_id: product.id,
      data: {
        name: product.name,
        description: product.description || '',
        url: `https://techspotuae.store/product/${product.id}`,
        image_url: product.images && product.images.length > 0 ? product.images[0] : '',
        availability: product.stock_quantity > 0 ? 'in stock' : 'out of stock',
        condition: 'new',
        price: parseFloat(product.price),
        currency: 'PKR',
        brand: 'tech spot uae',
        category: product.categories?.name || 'General',
      },
    }));

    console.log('Sending batch request to Meta Catalog API...');
    console.log(`Catalog ID: ${metaCatalogId}`);

    const formData = new URLSearchParams();
    formData.append('requests', JSON.stringify(requests));
    formData.append('access_token', metaAccessToken);

    const metaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${metaCatalogId}/batch`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    const responseText = await metaResponse.text();
    console.log('Meta API Response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Meta API response:', e);
      throw new Error(`Invalid response from Meta API: ${responseText}`);
    }

    if (!metaResponse.ok) {
      console.error('Meta API Error:', result);
      throw new Error(result.error?.message || 'Failed to sync with Meta Catalog');
    }

    const successCount = result.handles?.length || 0;
    console.log(`Successfully synced ${successCount} products`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully synced ${successCount} products to Meta Catalog`,
        synced: successCount,
        total: products.length,
        details: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in sync-meta-catalog:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
