
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ChefHat, LogOut, Calendar as CalendarIcon, PieChart } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import type { Plat } from '@/types/order';
import { useIsMobile } from '@/hooks/use-mobile';

type Commande = Database['public']['Tables']['commandes']['Row'] & {
  tables: { numero: number };
  details: Plat[];
};

const Historique = () => {
  const isMobile = useIsMobile();
  const [dateFiltree, setDateFiltree] = useState<Date>(new Date());
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [chargement, setChargement] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier l'authentification
    const isAuth = sessionStorage.getItem('historiqueAuth') === 'true';
    if (!isAuth) {
      navigate('/historique-auth');
      return;
    }
    
    chargerCommandesParJour();
    
    const dateStr = format(dateFiltree, 'yyyy-MM-dd');
    const debutJour = `${dateStr}T00:00:00`;
    const finJour = `${dateStr}T23:59:59`;
    
    const channel = supabase
      .channel('historique-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'commandes',
          filter: `heure_commande.gte.${debutJour},heure_commande.lte.${finJour}`
        },
        () => {
          chargerCommandesParJour();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateFiltree, navigate]);

  const chargerCommandesParJour = async () => {
    setChargement(true);
    try {
      const dateStr = format(dateFiltree, 'yyyy-MM-dd');
      const debutJour = `${dateStr}T00:00:00`;
      const finJour = `${dateStr}T23:59:59`;
      
      const { data, error } = await supabase
        .from('commandes')
        .select('*, tables(numero)')
        .gte('heure_commande', debutJour)
        .lte('heure_commande', finJour)
        .order('heure_commande', { ascending: true });
      
      if (error) throw error;
      setCommandes(data as Commande[]);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setChargement(false);
    }
  };

  const genererResume = () => {
    const platsVendus: { [key: string]: { quantite: number, total: number } } = {};
    let totalJour = 0;
    let nbCommandes = commandes.length;

    commandes.forEach(commande => {
      if (Array.isArray(commande.details)) {
        commande.details.forEach((item: any) => {
          const nom = item.nom;
          if (!platsVendus[nom]) {
            platsVendus[nom] = { quantite: 0, total: 0 };
          }
          platsVendus[nom].quantite += item.quantity || 1;
          platsVendus[nom].total += item.prix * (item.quantity || 1);
          totalJour += item.prix * (item.quantity || 1);
        });
      }
    });

    return (
      <div className="space-y-6">
        <div className="text-lg">
          <p className="font-medium text-indigo-800 flex items-center mb-1">
            <CalendarIcon className="mr-2 text-indigo-600" />
            Résumé du {format(dateFiltree, 'EEEE d MMMM yyyy', { locale: fr })}
          </p>
          <div className="bg-indigo-50 p-3 rounded-lg inline-flex items-center">
            <PieChart className="h-5 w-5 text-indigo-600 mr-2" />
            <p className="text-indigo-700">Nombre total de commandes: <span className="font-semibold">{nbCommandes}</span></p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-indigo-800 border-b border-indigo-200 pb-2">Détail des ventes:</h3>
          <div className="bg-white rounded-lg shadow-sm divide-y divide-indigo-100">
            {Object.entries(platsVendus).map(([nom, { quantite, total }]) => (
              <div key={nom} className="flex justify-between items-center py-3 px-4 hover:bg-indigo-50 transition-colors">
                <div>
                  <span className="font-medium text-indigo-700">{nom}</span>
                  <span className="text-indigo-500 ml-2">x{quantite}</span>
                </div>
                <span className="font-semibold text-green-600">{total.toLocaleString('fr-FR')} FCFA</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-indigo-200">
          <div className="flex justify-between items-center text-lg font-bold">
            <span className="text-indigo-800">Total journalier</span>
            <span className="text-xl bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              {totalJour.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        </div>
      </div>
    );
  };

  const deconnexion = () => {
    sessionStorage.removeItem('historiqueAuth');
    navigate('/historique-auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent flex items-center">
            <ChefHat className="mr-2 text-indigo-600" />
            Historique des commandes
          </h1>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              onClick={deconnexion} 
              className="flex items-center border-indigo-300 text-indigo-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
            <Link to="/cuisine">
              <Button 
                variant="outline"
                className="flex items-center border-indigo-300 text-indigo-700"
              >
                <ChefHat className="mr-2 h-4 w-4" />
                Retour à la cuisine
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-indigo-200 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle>Sélectionner une date</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={dateFiltree}
                onSelect={(date) => date && setDateFiltree(date)}
                className="rounded-md border border-indigo-200"
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-2 border-2 border-indigo-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="flex items-center">
                <PieChart className="mr-2 text-indigo-600" />
                Résumé des ventes
              </CardTitle>
            </CardHeader>
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              {chargement ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mr-2" />
                  <span className="text-indigo-700">Chargement des données...</span>
                </div>
              ) : commandes.length === 0 ? (
                <div className="text-center py-8 bg-indigo-50 rounded-lg">
                  <CalendarIcon className="h-12 w-12 mx-auto text-indigo-400 mb-3" />
                  <p className="text-indigo-600">Aucune commande pour cette journée</p>
                </div>
              ) : (
                genererResume()
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Historique;
