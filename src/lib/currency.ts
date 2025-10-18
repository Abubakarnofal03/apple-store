export const formatPrice = (price: number): string => {
  return `Rs ${price.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};
