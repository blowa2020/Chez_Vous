
import React from 'react';
import { Button } from '@/components/ui/button';
import type { Plat } from '@/types/order';

interface CartItemProps {
  plat: Plat & { quantity: number };
  onRemove: (platId: number) => void;
}

export const CartItem = ({ plat, onRemove }: CartItemProps) => {
  return (
    <div className="flex items-center gap-4 border-b pb-3">
      {plat.image_url && (
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded">
          <img 
            src={plat.image_url} 
            alt={plat.nom}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 justify-between items-center">
        <div>
          <h3 className="font-medium">
            {plat.nom}
            {plat.quantity > 1 && <span className="ml-2 text-gray-600">x{plat.quantity}</span>}
          </h3>
          <p className="text-sm text-gray-500">{plat.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold">{(plat.prix * plat.quantity).toLocaleString('fr-FR')} FCFA</span>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => onRemove(plat.id)}
          >
            Retirer
          </Button>
        </div>
      </div>
    </div>
  );
};
