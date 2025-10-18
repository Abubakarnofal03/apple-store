import { useEffect } from "react";

const NotFound = () => {
  useEffect(() => {
    // Redirect to home page immediately
    window.location.href = "https://theshoppingcart.shop";
  }, []);

  return null;
};

export default NotFound;
