import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { CartItem } from '@/components/cart/CartItem';
import { PaymentDialog } from '@/components/cart/PaymentDialog';
import { useCart } from '@/hooks/useCart';
import { toast } from '@/components/ui/sonner';
import { Loader2, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Panier = () => {
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table') || '1';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    commandeActuelle,
    methodePaiement,
    showPaymentDialog,
    setMethodePaiement,
    setShowPaymentDialog,
    supprimerDuPanier,
    ouvrirDialoguePaiement,
    passerCommande,
    calculerTotal,
    getGroupedItems,
  } = useCart(tableId);

  const groupedItems = getGroupedItems();

  const handleSubmitOrder = async () => {
    try {
      setIsSubmitting(true);

      const success = await passerCommande();

      if (success !== false) {
        setShowPaymentDialog(false);
        // Optionnel : rediriger après succès
        // navigate(`/suivi?table=${tableId}`);
      }
    } catch (error: any) {
      console.error('Erreur lors de la commande:', error);
      toast.error('Erreur lors de la commande. Vérifiez votre connexion ou réessayez.');
      alert('Une erreur est survenue lors de la commande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full px-2 sm:container sm:mx-auto sm:max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent flex items-center">
            <ShoppingCart className="mr-2 text-indigo-600" />
            Votre panier
          </h1>
          <Link to={`/menu?table=${tableId}`}>
            <Button
              variant="outline"
              className="border-indigo-300 text-indigo-700 flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au menu
            </Button>
          </Link>
        </div>

        <Card className="border-2 border-indigo-200 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle className="text-indigo-800">Table {tableId} - Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent className={`p-4 ${isMobile ? 'p-3' : 'p-6'}`}>
            {groupedItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-indigo-400 mb-3" />
                <p className="text-indigo-500 mb-4">Votre panier est vide</p>
                <Link to={`/menu?table=${tableId}`}>
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
                    Retourner au menu
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedItems.map((plat) => (
                  <CartItem key={plat.id} plat={plat} onRemove={supprimerDuPanier} />
                ))}

                <div className="flex justify-between items-center pt-4 border-t border-indigo-200 mt-6">
                  <span className="text-lg font-bold text-indigo-800">Total</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                    {calculerTotal().toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            )}
          </CardContent>

          {groupedItems.length > 0 && (
            <CardFooter className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
              <Button
                onClick={ouvrirDialoguePaiement}
                disabled={isSubmitting}
                className="ml-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  'Valider la commande'
                )}
              </Button>
            </CardFooter>
          )}
        </Card>

        {!isSubmitting && groupedItems.length > 0 && (
          <div className="text-red-600 mt-4 text-center">
            Une erreur ? Vérifiez votre connexion internet.
          </div>
        )}

        <PaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          methodePaiement={methodePaiement}
          onMethodePaiementChange={setMethodePaiement}
          onConfirm={handleSubmitOrder}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default Panier;
