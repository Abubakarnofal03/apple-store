import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface Variation {
  id?: string;
  name: string;
  price: string;
  quantity: string;
  sort_order: number;
  apply_sale: boolean;
}

interface VariationManagerProps {
  variations: Variation[];
  onChange: (variations: Variation[]) => void;
}

export function VariationManager({ variations, onChange }: VariationManagerProps) {
  const addVariation = () => {
    const newVariation: Variation = {
      name: "",
      price: "",
      quantity: "0",
      sort_order: variations.length,
      apply_sale: true,
    };
    onChange([...variations, newVariation]);
  };

  const removeVariation = (index: number) => {
    const updated = variations.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateVariation = (index: number, field: keyof Variation, value: string | boolean) => {
    const updated = variations.map((v, i) => 
      i === index ? { ...v, [field]: value } : v
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Product Variations (Optional)</Label>
        <Button type="button" size="sm" variant="outline" onClick={addVariation}>
          <Plus className="h-4 w-4 mr-1" />
          Add Variation
        </Button>
      </div>
      
      {variations.length > 0 && (
        <div className="space-y-2">
          {variations.map((variation, index) => (
            <Card key={index}>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="mt-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input
                          placeholder="e.g., 1 pc, 2 pcs"
                          value={variation.name}
                          onChange={(e) => updateVariation(index, "name", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={variation.price}
                          onChange={(e) => updateVariation(index, "price", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={variation.quantity}
                          onChange={(e) => updateVariation(index, "quantity", e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`apply-sale-${index}`}
                        checked={variation.apply_sale}
                        onChange={(e) => updateVariation(index, "apply_sale", e.target.checked)}
                        className="rounded border-input"
                      />
                      <Label htmlFor={`apply-sale-${index}`} className="text-xs cursor-pointer">
                        Apply sale discount to this variation
                      </Label>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 mt-4"
                    onClick={() => removeVariation(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
