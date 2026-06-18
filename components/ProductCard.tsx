"use client";
 
import React from "react";
import { Check, Plus, Minus, ShoppingCart } from "lucide-react";
 
export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    summary: string;
    price: {
      amount: number | null;
      currency: string;
    };
    image_url: string | null;
    in_stock: boolean;
  };
  isSelected: boolean;
  quantity: number;
  onSelect: (product: any) => void;
  onDeselect: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}
 
export default function ProductCard({
  product,
  isSelected,
  quantity,
  onSelect,
  onDeselect,
  onUpdateQuantity,
}: ProductCardProps) {
  const priceDisplay = product.price.amount !== null
    ? `${product.price.currency} ${product.price.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    : "Price on request";
 
  const handleSelectToggle = () => {
    if (isSelected) {
      onDeselect(product.id);
    } else {
      onSelect(product);
    }
  };
 
  const incrementQty = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity(product.id, quantity + 1);
  };
 
  const decrementQty = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 1) {
      onUpdateQuantity(product.id, quantity - 1);
    } else {
      onDeselect(product.id);
    }
  };
 
  // Safe fallback for images
  const imageUrl = product.image_url || "/placeholder-product.png";
 
  return (
    <div
      className={`glass-card flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
        isSelected
          ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/10"
          : "border-border"
      }`}
    >
      {/* Product Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-secondary flex items-center justify-center">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              // Fallback if image fails to load
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=400&auto=format&fit=crop";
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground/50 gap-1">
            <ShoppingCart className="w-8 h-8" />
            <span className="text-xs">Kapruka Item</span>
          </div>
        )}
 
        {/* Stock Badge */}
        {!product.in_stock && (
          <div className="absolute top-2 right-2 bg-red-900/90 text-red-200 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
            OUT OF STOCK
          </div>
        )}
      </div>
 
      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-semibold text-foreground text-sm line-clamp-1 transition-colors group-hover:text-indigo-400">
            {product.name}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">
            {product.summary || "Premium quality product discovered from Kapruka's catalog."}
          </p>
        </div>
 
        <div className="mt-4">
          <div className="text-base font-bold text-indigo-500 mb-3">{priceDisplay}</div>
 
          {/* Action Buttons */}
          {isSelected ? (
            <div className="flex items-center gap-2 w-full">
              {/* Quantity Selector */}
              <div className="flex items-center bg-secondary border border-border rounded-xl overflow-hidden flex-1 justify-between h-9">
                <button
                  onClick={decrementQty}
                  className="px-2 hover:bg-muted text-muted-foreground transition-colors h-full flex items-center justify-center w-8 cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-bold text-foreground">{quantity}</span>
                <button
                  onClick={incrementQty}
                  className="px-2 hover:bg-muted text-muted-foreground transition-colors h-full flex items-center justify-center w-8 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Checkmark Button */}
              <button
                onClick={handleSelectToggle}
                className="bg-indigo-650 text-white rounded-xl px-3 hover:bg-indigo-700 transition-colors h-9 flex items-center justify-center cursor-pointer btn-animated"
                title="Deselect item"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSelectToggle}
              disabled={!product.in_stock}
              className={`w-full text-sm font-semibold py-2 px-3 rounded-xl border transition-all duration-300 h-9 flex items-center justify-center gap-1.5 btn-animated cursor-pointer ${
                product.in_stock
                  ? "bg-secondary hover:bg-indigo-600 hover:border-indigo-500 text-foreground hover:text-white border-border"
                  : "bg-secondary/40 border-border text-muted-foreground/30 cursor-not-allowed"
              }`}
            >
              Select
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
