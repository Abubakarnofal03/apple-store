import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface Color {
  id?: string;
  name: string;
  color_code: string;
  price: string;
  quantity: string;
  sort_order: number;
  apply_sale: boolean;
}

interface ColorManagerProps {
  colors: Color[];
  onChange: (colors: Color[]) => void;
}

export function ColorManager({ colors, onChange }: ColorManagerProps) {
  const addColor = () => {
    const newColor: Color = {
      name: "",
      color_code: "#000000",
      price: "",
      quantity: "0",
      sort_order: colors.length,
      apply_sale: true,
    };
    onChange([...colors, newColor]);
  };

  const removeColor = (index: number) => {
    const updated = colors.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateColor = (index: number, field: keyof Color, value: string | boolean) => {
    const updated = colors.map((c, i) => 
      i === index ? { ...c, [field]: value } : c
    );
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Product Colors (Optional)</Label>
        <Button type="button" size="sm" variant="outline" onClick={addColor}>
          <Plus className="h-4 w-4 mr-1" />
          Add Color
        </Button>
      </div>
      
      {colors.length > 0 && (
        <div className="space-y-2">
          {colors.map((color, index) => (
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
                          placeholder="e.g., Red, Blue"
                          value={color.name}
                          onChange={(e) => updateColor(index, "name", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Color Code</Label>
                        <div className="flex gap-1">
                          <Input
                            type="color"
                            value={color.color_code}
                            onChange={(e) => updateColor(index, "color_code", e.target.value)}
                            className="h-8 w-12 p-1 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={color.color_code}
                            onChange={(e) => updateColor(index, "color_code", e.target.value)}
                            placeholder="#000000"
                            className="h-8 flex-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={color.price}
                          onChange={(e) => updateColor(index, "price", e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={color.quantity}
                          onChange={(e) => updateColor(index, "quantity", e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`apply-sale-color-${index}`}
                        checked={color.apply_sale}
                        onChange={(e) => updateColor(index, "apply_sale", e.target.checked)}
                        className="rounded border-input"
                      />
                      <Label htmlFor={`apply-sale-color-${index}`} className="text-xs cursor-pointer">
                        Apply sale discount to this color
                      </Label>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 mt-4"
                    onClick={() => removeColor(index)}
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
