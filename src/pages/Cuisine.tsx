
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import type { Database, Json } from '@/integrations/supabase/types';
import KitchenOrdersList from '@/components/cuisine/KitchenOrdersList';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OrderDetailItem {
  nom: string;
  prix: number;
  quantity: number;
}

type Commande = Database['public']['Tables']['commandes']['Row'] & {
  tables: { numero: number };
  details: Json;
};

const Cuisine = () => {
  const [motDePasse, setMotDePasse] = useState('');
  const [connected, setConnected] = useState(false);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [totalJournalier, setTotalJournalier] = useState(0);

  useEffect(() => {
    if (connected) {
      fetchCommandes();
      
      const channel = supabase
        .channel('commandes-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'commandes' },
          () => fetchCommandes()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [connected]);

  const fetchCommandes = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from('commandes')
        .select('*, tables(numero)')
        .gte('heure_commande', startOfDay)
        .lte('heure_commande', endOfDay)
        .order('heure_commande', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const activeOrders = data.filter(order => order.statut !== 'servi') as Commande[];
        setCommandes(activeOrders);
        
        // Calculer le total uniquement pour les commandes servies
        const servedOrders = data.filter(order => order.statut === 'servi') as Commande[];
        
        const total = servedOrders.reduce((sum: number, order) => {
          const orderDetails = Array.isArray(order.details) ? order.details : [];
          
          const orderTotal = orderDetails.reduce((orderSum: number, item) => {
            if (typeof item !== 'object' || item === null) {
              return orderSum;
            }
            
            try {
              const itemDetails = item as Record<string, unknown>;
              
              let prix = 0;
              if (typeof itemDetails.prix === 'number') {
                prix = itemDetails.prix;
              } else if (typeof itemDetails.prix === 'string') {
                prix = parseFloat(itemDetails.prix);
              }
              
              let quantity = 1;
              if (typeof itemDetails.quantity === 'number') {
                quantity = itemDetails.quantity;
              } else if (typeof itemDetails.quantity === 'string') {
                quantity = parseFloat(itemDetails.quantity);
              }
              
              if (isNaN(prix)) prix = 0;
              if (isNaN(quantity)) quantity = 1;
              
              return orderSum + (prix * quantity);
            } catch (err) {
              console.error("Erreur lors du calcul d'un article:", err);
              return orderSum;
            }
          }, 0);
          
          // Ensure orderTotal is always a number
          const numericOrderTotal = typeof orderTotal === 'number' ? orderTotal : 0;
          return sum + numericOrderTotal;
        }, 0);
        
        setTotalJournalier(total);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    }
  };

  const mettreAJourStatut = async (id: string, nouveauStatut: string) => {
    try {
      const { error } = await supabase
        .from('commandes')
        .update({ statut: nouveauStatut })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Statut mis à jour: ${nouveauStatut}`);
      
      // Si le statut est "servi", recalculer le total journalier immédiatement
      if (nouveauStatut === 'servi') {
        fetchCommandes();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const authentifier = () => {
    if (motDePasse === 'Lemuel2020') {
      setConnected(true);
      toast.success('Connecté avec succès');
    } else {
      toast.error('Mot de passe incorrect');
    }
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Espace Cuisine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <input 
                type="password"
                placeholder="Mot de passe"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className="px-4 py-2 border rounded"
              />
              <Button onClick={authentifier}>Se connecter</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <KitchenOrdersList
      commandes={commandes}
      totalJournalier={totalJournalier}
      onUpdateStatus={mettreAJourStatut}
    />
  );
};

export default Cuisine;
