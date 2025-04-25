import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Clock, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import OrderProgress from '@/components/OrderProgress';
import type { Database } from '@/integrations/supabase/types';

type Commande = Database['public']['Tables']['commandes']['Row'];
type RealtimePayload = {
  new: Record<string, any> | null;
  old: Record<string, any> | null;
};

const SuiviCommande = () => {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table') || '1';
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState<number | null>(null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCommandes();
    updateQueuePosition();

    const channel = supabase
      .channel('commandes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'commandes' },
        (payload: RealtimePayload) => {
          if (commandes.length > 0 && payload.new && payload.new.id === commandes[0].id) {
            if (payload.new.statut) {
              setLocalStatus(payload.new.statut as string);
            }
          }
          fetchCommandes();
          updateQueuePosition();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId]);

  const updateQueuePosition = async () => {
    try {
      const { data: tableData } = await supabase
        .from('tables')
        .select('id')
        .eq('numero', parseInt(tableId))
        .maybeSingle();

      if (!tableData) return;

      const { data: ourOrder } = await supabase
        .from('commandes')
        .select('id, heure_commande')
        .eq('table_id', tableData.id)
        .eq('statut', 'en attente')
        .order('heure_commande', { ascending: false })
        .limit(1)
        .single();

      if (!ourOrder) return;

      const { data: allPendingOrders } = await supabase
        .from('commandes')
        .select('id, heure_commande')
        .eq('statut', 'en attente')
        .order('heure_commande', { ascending: true });

      if (!allPendingOrders) return;

      const index = allPendingOrders.findIndex(c => c.id === ourOrder.id);
      setPosition(index >= 0 ? index : null);
    } catch (error) {
      console.error('Erreur lors de la récupération de la position:', error);
    }
  };

  const fetchCommandes = async () => {
    try {
      setLoading(true);

      const { data: tableData } = await supabase
        .from('tables')
        .select('id')
        .eq('numero', parseInt(tableId))
        .maybeSingle();

      if (!tableData) {
        setCommandes([]);
        return;
      }

      const { data } = await supabase
        .from('commandes')
        .select('*, tables(numero)')
        .eq('table_id', tableData.id)
        .order('heure_commande', { ascending: false })
        .limit(1);

      if (data) {
        setCommandes(data);
        if (data.length > 0) {
          setLocalStatus(data[0].statut);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const supprimerCommande = async (commandeId: string) => {
    const { data: commande, error } = await supabase
      .from('commandes')
      .select('statut')
      .eq('id', commandeId)
      .single();

    if (error || !commande || commande.statut !== 'en attente') {
      toast.error("La commande ne peut plus être annulée.");
      return;
    }

    const { error: deleteError } = await supabase
      .from('commandes')
      .delete()
      .eq('id', commandeId);

    if (deleteError) {
      toast.error('Erreur lors de la suppression de la commande');
      return;
    }

    toast.success('Commande annulée');
    setCommandes([]);
    setLocalStatus(null);
    navigate(`/menu?table=${tableId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-indigo-800">Chargement de votre commande...</p>
      </div>
    );
  }

  if (commandes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full px-2 sm:container sm:mx-auto sm:max-w-3xl">
          <div className="flex justify-start mb-6">
            <Button
              variant="outline"
              onClick={() => navigate(`/menu?table=${tableId}`)}
              className="flex items-center gap-2 border-indigo-300 text-indigo-700"
            >
              <ArrowLeft size={16} />
              Retour au menu
            </Button>
          </div>

          <Card className="shadow-lg border-2 border-indigo-200">
            <CardContent className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-indigo-400 mb-4" />
              <h3 className="text-xl font-medium mb-2 text-indigo-800">Aucune commande en cours</h3>
              <p className="text-indigo-500 mb-4">Vous n'avez pas encore passé de commande</p>
              <Button
                onClick={() => navigate(`/menu?table=${tableId}`)}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                Commander maintenant
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const commande = commandes[0];
  const details = Array.isArray(commande.details) ? commande.details : [];
  const displayStatus = localStatus || commande.statut;

  const retourAuMenu = () => {
    if (displayStatus !== 'servi') {
      toast.error("Vous ne pouvez pas retourner au menu tant que la commande n'est pas servie");
      return;
    }

    navigate(`/menu?table=${tableId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full px-2 sm:container sm:mx-auto sm:max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
            Suivi de votre commande
          </h1>
          <Button
            variant="outline"
            onClick={retourAuMenu}
            className="flex items-center gap-2 border-indigo-300 text-indigo-700"
          >
            <ArrowLeft size={16} />
            Retour au menu
          </Button>
        </div>

        <Card key={commande.id} className="overflow-hidden border-2 border-indigo-200 shadow-lg">
          <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-indigo-800">
                Commande du {new Date(commande.heure_commande).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </CardTitle>
              {displayStatus === 'en attente' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowConfirmation(true)}
                  className="flex items-center gap-1 bg-gradient-to-r from-red-500 to-rose-500"
                >
                  <Trash2 size={16} />
                  Annuler
                </Button>
              )}
            </div>
            <CardDescription>Table {tableId} • {commande.methode_paiement}</CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <OrderProgress status={displayStatus as any} />

            {position !== null && displayStatus === 'en attente' && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <Clock className="text-amber-500" size={18} />
                <p className="text-amber-700">
                  <span className="font-medium">File d'attente :</span>{' '}
                  {position === 0
                    ? "Un peu de patience, vous êtes la prochaine commande à être prise."
                    : `${position} commande${position > 1 ? 's' : ''} avant la vôtre.`}
                </p>
              </div>
            )}

            <div className="space-y-3 mt-4">
              {details.map((plat: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-2 hover:bg-indigo-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    {plat.image_url && (
                      <img
                        src={plat.image_url}
                        alt={plat.nom}
                        className="w-16 h-16 object-cover rounded-lg shadow-sm"
                      />
                    )}
                    <span className="font-medium text-indigo-800">
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md mr-2">
                        {plat.quantity || 1}x
                      </span>
                      {plat.nom}
                    </span>
                  </div>
                  <span className="font-bold text-green-600">
                    {plat.prix.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              ))}

              <div className="flex justify-between pt-3 border-t border-indigo-200 font-bold">
                <span className="text-indigo-800">Total</span>
                <span className="text-2xl bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                  {details.reduce((sum: number, plat: any) => sum + (plat.prix * (plat.quantity || 1)), 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>

            {displayStatus === 'prêt' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-center">
                <p className="text-green-700 font-medium">Votre commande est prête !</p>
                <p className="text-sm text-green-600">Elle sera servie à votre table très prochainement.</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-between">
            <span className="text-sm text-indigo-600">Paiement: {commande.methode_paiement}</span>
            <span className="text-sm text-indigo-600">Table {tableId}</span>
          </CardFooter>
        </Card>

        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 border-2 border-indigo-200 animate-scale-in">
              <h2 className="text-lg font-semibold mb-2 text-indigo-800">Annuler la commande ?</h2>
              <p className="text-indigo-600 mb-4">Voulez-vous vraiment annuler la commande ?</p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowConfirmation(false)} className="text-indigo-700 hover:bg-indigo-50">
                  Non
                </Button>
                <Button variant="destructive" onClick={() => supprimerCommande(commande.id)} className="bg-gradient-to-r from-red-500 to-rose-500">
                  Oui
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuiviCommande;
