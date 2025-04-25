import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import type { Plat } from '@/types/order';

export const useCart = (tableId: string) => {
  const [commandeActuelle, setCommandeActuelle] = useState<Plat[]>([]);
  const [methodePaiement, setMethodePaiement] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [commandeEnCours, setCommandeEnCours] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedOrder = localStorage.getItem(`panier_table_${tableId}`);
    if (savedOrder) {
      setCommandeActuelle(JSON.parse(savedOrder));
    }
    checkOrderInProgress();
  }, [tableId]);

  const checkOrderInProgress = async () => {
    try {
      const { data: tableData } = await supabase
        .from('tables')
        .select('id')
        .eq('numero', parseInt(tableId))
        .maybeSingle();

      if (!tableData) return;

      const { data: activeOrder } = await supabase
        .from('commandes')
        .select('id, statut')
        .eq('table_id', tableData.id)
        .not('statut', 'eq', 'servi')
        .order('heure_commande', { ascending: false })
        .maybeSingle();

      if (activeOrder) {
        setCommandeEnCours(activeOrder.id);
      } else {
        setCommandeEnCours(null);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des commandes en cours:', error);
    }
  };

  const getGroupedItems = () => {
    const groupedItems = commandeActuelle.reduce((acc, item) => {
      const existingItem = acc.find(i => i.id === item.id);
      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
        return acc;
      }
      return [...acc, { ...item, quantity: 1 }];
    }, [] as (Plat & { quantity: number })[]);

    return groupedItems;
  };

  const supprimerDuPanier = (platId: number) => {
    const newPanier = commandeActuelle.filter(p => p.id !== platId);
    setCommandeActuelle(newPanier);
    localStorage.setItem(`panier_table_${tableId}`, JSON.stringify(newPanier));
  };

  const ouvrirDialoguePaiement = () => {
    if (commandeActuelle.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }
    setShowPaymentDialog(true);
  };

  const passerCommande = async () => {
    try {
      if (!methodePaiement) {
        toast.error('Veuillez sélectionner une méthode de paiement');
        return;
      }

      const tableNumero = parseInt(tableId);
      if (isNaN(tableNumero) || tableNumero <= 0) {
        toast.error('Numéro de table invalide');
        return;
      }

      const { data: tableExists, error: tableError } = await supabase
        .from('tables')
        .select('id')
        .eq('numero', tableNumero)
        .maybeSingle();

      if (tableError) {
        console.error('Erreur lors de la vérification de la table:', tableError);
        toast.error('Erreur lors de la vérification de la table');
        return;
      }

      let resolvedTableId;
      if (!tableExists) {
        const { data: newTable, error: createError } = await supabase
          .from('tables')
          .insert({ numero: tableNumero })
          .select('id')
          .single();

        if (createError || !newTable) {
          console.error('Erreur lors de la création de la table:', createError);
          toast.error('Impossible de créer une nouvelle table');
          return;
        }
        resolvedTableId = newTable.id;
      } else {
        resolvedTableId = tableExists.id;
      }

      const groupedItems = getGroupedItems();

      const { data: newOrder, error: orderError } = await supabase
        .from('commandes')
        .insert({
          details: groupedItems,
          table_id: resolvedTableId,
          statut: 'en attente',
          methode_paiement: methodePaiement
        })
        .select('id')
        .single();

      if (orderError) {
        console.error('Erreur lors de l\'enregistrement de la commande:', orderError);
        toast.error('Erreur lors de l\'enregistrement de la commande');
        return;
      }

      setShowPaymentDialog(false);
      setCommandeActuelle([]);
      localStorage.removeItem(`panier_table_${tableNumero}`);
      toast.success('Votre commande a été enregistrée !');
      setCommandeEnCours(newOrder.id);

      // ✅ Petit délai pour stabiliser l'affichage avant la redirection
      setTimeout(() => {
        navigate(`/suivi?table=${tableNumero}`);
      }, 300);
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      toast.error('Erreur lors de l\'enregistrement de la commande');
    }
  };

  const annulerCommande = async (commandeId: string) => {
    try {
      const { data: commande, error: fetchError } = await supabase
        .from('commandes')
        .select('statut')
        .eq('id', commandeId)
        .single();

      if (fetchError || !commande) {
        console.error('Erreur lors de la récupération de la commande:', fetchError);
        toast.error('Erreur lors de la récupération de la commande');
        return false;
      }

      if (commande.statut !== 'en attente') {
        toast.error('Cette commande est déjà en cours de préparation et ne peut pas être annulée');
        return false;
      }

      const { error: deleteError } = await supabase
        .from('commandes')
        .delete()
        .eq('id', commandeId);

      if (deleteError) {
        console.error('Erreur lors de la suppression de la commande:', deleteError);
        toast.error('Erreur lors de la suppression de la commande');
        return false;
      }

      setCommandeEnCours(null);
      toast.success('La commande a été annulée');
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la commande:', error);
      toast.error('Erreur lors de l\'annulation de la commande');
      return false;
    }
  };

  const calculerTotal = () => {
    return commandeActuelle.reduce((total, plat) => total + plat.prix, 0);
  };

  return {
    commandeActuelle,
    methodePaiement,
    showPaymentDialog,
    commandeEnCours,
    setMethodePaiement,
    setShowPaymentDialog,
    supprimerDuPanier,
    ouvrirDialoguePaiement,
    passerCommande,
    annulerCommande,
    calculerTotal,
    getGroupedItems,
  };
};
