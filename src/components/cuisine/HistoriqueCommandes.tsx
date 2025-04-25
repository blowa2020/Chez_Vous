
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import type { Plat } from '@/types/order';

interface HistoriqueCommandesProps {
  open: boolean;
  onClose: () => void;
}

export const HistoriqueCommandes = ({ open, onClose }: HistoriqueCommandesProps) => {
  const [dateFiltree, setDateFiltree] = useState<Date | undefined>(new Date());
  const [commandesParJour, setCommandesParJour] = useState<{[key: string]: any[]}>({});
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (open && dateFiltree) {
      chargerCommandes();
      
      // Abonnement aux changements en temps réel pour cette date
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
            chargerCommandes();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, dateFiltree]);

  const chargerCommandes = async () => {
    if (!dateFiltree) return;
    
    setChargement(true);
    
    try {
      // Formatage de la date pour créer des limites de début et fin de journée
      const dateStr = format(dateFiltree, 'yyyy-MM-dd');
      const debutJour = `${dateStr}T00:00:00`;
      const finJour = `${dateStr}T23:59:59`;
      
      const { data, error } = await supabase
        .from('commandes')
        .select('*, tables(numero)')
        .gte('heure_commande', debutJour)
        .lte('heure_commande', finJour)
        .order('heure_commande', { ascending: false });
      
      if (error) throw error;
      
      // Grouper les commandes par jour
      const commandesGroupees: {[key: string]: any[]} = {};
      
      if (data) {
        const jour = format(dateFiltree, 'yyyy-MM-dd');
        commandesGroupees[jour] = data;
      }
      
      setCommandesParJour(commandesGroupees);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setChargement(false);
    }
  };
  
  const calculerTotalJournee = (commandes: any[]): number => {
    return commandes.reduce((total, commande) => {
      const details = JSON.parse(JSON.stringify(commande.details)) as Plat[];
      const totalCommande = details.reduce((sum, plat) => sum + plat.prix, 0);
      return total + totalCommande;
    }, 0);
  };

  const formatDateFr = (dateStr: string): string => {
    return format(parseISO(dateStr), 'EEEE d MMMM yyyy', { locale: fr });
  };

  const dateSelectionnee = dateFiltree ? format(dateFiltree, 'yyyy-MM-dd') : '';
  const commandesJour = commandesParJour[dateSelectionnee] || [];
  const totalJournee = calculerTotalJournee(commandesJour);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-3xl overflow-y-auto">
        <SheetHeader className="sticky top-0 bg-background z-10 pb-4">
          <SheetTitle>Historique des Commandes</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Sélectionner une date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={dateFiltree}
                onSelect={setDateFiltree}
                className="p-3 pointer-events-auto"
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {dateFiltree && formatDateFr(format(dateFiltree, 'yyyy-MM-dd'))}
              </CardTitle>
              <Badge variant="outline" className="ml-2">
                Total: {totalJournee.toLocaleString('fr-FR')} FCFA
              </Badge>
            </CardHeader>
            <CardContent>
              {chargement ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Chargement des données...</span>
                </div>
              ) : commandesJour.length === 0 ? (
                <div className="text-center py-8">Aucune commande pour cette journée</div>
              ) : (
                <div className="space-y-4">
                  {commandesJour.map((commande) => {
                    const details = JSON.parse(JSON.stringify(commande.details)) as Plat[];
                    const totalCommande = details.reduce((sum, plat) => sum + plat.prix, 0);
                    
                    return (
                      <Card key={commande.id} className="shadow-sm">
                        <CardHeader className="py-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-semibold">Table {commande.tables.numero}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {format(parseISO(commande.heure_commande), 'HH:mm')}
                              </span>
                            </div>
                            <Badge variant={commande.statut === 'servi' ? 'default' : 'secondary'}>
                              {commande.statut}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-2">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[50%]">Plat</TableHead>
                                <TableHead className="text-right">Prix</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {details.map((plat, idx) => (
                                <TableRow key={`${commande.id}-${idx}`}>
                                  <TableCell>{plat.nom}</TableCell>
                                  <TableCell className="text-right">{plat.prix.toLocaleString('fr-FR')} FCFA</TableCell>
                                </TableRow>
                              ))}
                              <TableRow>
                                <TableCell className="font-bold">Total</TableCell>
                                <TableCell className="text-right font-bold">{totalCommande.toLocaleString('fr-FR')} FCFA</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};
