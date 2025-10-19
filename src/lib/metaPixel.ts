// Meta Pixel tracking utilities
// Centralized tracking logic to prevent duplicate events and ensure modularity

declare global {
  interface Window {
    fbq: any;
  }
}

/**
 * Track Add to Cart event
 * @param productId - The product ID
 * @param productName - The product name
 * @param price - The product price
 * @param currency - The currency code (default: AED)
 */
export const trackAddToCart = (
  productId: string,
  productName: string,
  price: number,
  currency: string = 'AED'
) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: [productId],
      content_name: productName,
      value: price,
      currency: currency,
    });
    console.log('Meta Pixel: AddToCart tracked', { productId, productName, price });
  }
};

/**
 * Track Initiate Checkout event
 */
export const trackInitiateCheckout = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout');
    console.log('Meta Pixel: InitiateCheckout tracked');
  }
};

/**
 * Track Purchase event (Cash on Delivery)
 * @param totalAmount - The total order amount
 * @param currency - The currency code (default: AED)
 * @param orderId - Optional order ID for reference
 */
export const trackPurchase = (
  totalAmount: number,
  currency: string = 'AED',
  orderId?: string
) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', {
      value: totalAmount,
      currency: currency,
      ...(orderId && { content_ids: [orderId] }),
    });
    console.log('Meta Pixel: Purchase tracked', { totalAmount, orderId });
  }
};
