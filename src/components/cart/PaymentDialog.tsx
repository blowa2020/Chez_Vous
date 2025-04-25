
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  methodePaiement: string;
  onMethodePaiementChange: (value: string) => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export const PaymentDialog = ({
  open,
  onOpenChange,
  methodePaiement,
  onMethodePaiementChange,
  onConfirm,
  isSubmitting = false,
}: PaymentDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finaliser votre commande</DialogTitle>
          <DialogDescription>
            Veuillez sélectionner votre méthode de paiement préférée
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Select value={methodePaiement} onValueChange={onMethodePaiementChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une méthode de paiement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="especes">Espèces</SelectItem>
              <SelectItem value="carte">Carte bancaire</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="orange_money">Orange Money</SelectItem>
              <SelectItem value="wave">Wave</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting || !methodePaiement}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              'Confirmer la commande'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
