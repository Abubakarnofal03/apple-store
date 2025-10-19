export const formatPrice = (price: number): string => {
  return `د.إ ${price.toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};
