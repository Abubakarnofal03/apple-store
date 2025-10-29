// TikTok Pixel tracking utilities
// Centralized tracking logic to prevent duplicate events and ensure modularity

declare global {
  interface Window {
    ttq: any;
  }
}

/**
 * Track ViewContent event
 * @param productId - The product ID
 * @param productName - The product name
 * @param price - The product price
 * @param currency - The currency code (default: AED)
 */
export const trackViewContent = (
  productId: string,
  productName: string,
  price: number,
  currency: string = 'AED'
) => {
  if (typeof window !== 'undefined' && window.ttq && typeof window.ttq.track === 'function') {
    try {
      window.ttq.track('ViewContent', {
        content_id: productId,
        content_name: productName,
        value: price,
        currency: currency,
      });
      console.log('TikTok Pixel: ViewContent tracked', { productId, productName, price });
    } catch (error) {
      console.error('TikTok Pixel ViewContent error:', error);
    }
  }
};

/**
 * Track AddToCart event
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
  if (typeof window !== 'undefined' && window.ttq && typeof window.ttq.track === 'function') {
    try {
      window.ttq.track('AddToCart', {
        content_id: productId,
        content_name: productName,
        content_type: 'product',
        value: price,
        currency: currency,
      });
      console.log('TikTok Pixel: AddToCart tracked', { productId, productName, price });
    } catch (error) {
      console.error('TikTok Pixel AddToCart error:', error);
    }
  }
};

/**
 * Track InitiateCheckout event
 * @param total - The total cart value
 * @param items - Array of cart items
 * @param currency - The currency code (default: AED)
 */
export const trackInitiateCheckout = (
  total: number,
  items: Array<{ id: string; quantity: number; price: number }>,
  currency: string = 'AED'
) => {
  if (typeof window !== 'undefined' && window.ttq && typeof window.ttq.track === 'function') {
    try {
      window.ttq.track('InitiateCheckout', {
        value: total,
        currency: currency,
        contents: items.map(item => ({
          content_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      });
      console.log('TikTok Pixel: InitiateCheckout tracked', { total, itemCount: items.length });
    } catch (error) {
      console.error('TikTok Pixel InitiateCheckout error:', error);
    }
  }
};

/**
 * Track CompletePayment event (Purchase)
 * @param orderId - The order ID
 * @param totalAmount - The total order amount
 * @param items - Array of order items
 * @param currency - The currency code (default: AED)
 */
export const trackCompletePayment = (
  orderId: string,
  totalAmount: number,
  items: Array<{ id: string; quantity: number; price: number }>,
  currency: string = 'AED'
) => {
  if (typeof window !== 'undefined' && window.ttq && typeof window.ttq.track === 'function') {
    try {
      window.ttq.track('CompletePayment', {
        content_id: orderId,
        value: totalAmount,
        currency: currency,
        contents: items.map(item => ({
          content_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      });
      console.log('TikTok Pixel: CompletePayment tracked', { orderId, totalAmount });
    } catch (error) {
      console.error('TikTok Pixel CompletePayment error:', error);
    }
  }
};
