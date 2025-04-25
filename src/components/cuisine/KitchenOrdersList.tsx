
import React, { useState } from 'react';
import { Clock, History, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Database, Json } from '@/integrations/supabase/types';

type Commande = Database['public']['Tables']['commandes']['Row'] & {
  tables: { numero: number };
  details: Json;
};

interface KitchenOrdersListProps {
  commandes: Commande[];
  totalJournalier: number;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'en attente':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'en préparation':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'prêt':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'servi':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const KitchenOrdersList = ({ commandes, totalJournalier, onUpdateStatus }: KitchenOrdersListProps) => {
  // Statut local pour la mise à jour immédiate de l'UI
  const [localStatuses, setLocalStatuses] = useState<{[key: string]: string}>({});
  
  const handleStatusChange = async (id: string, newStatus: string) => {
    // Mettre à jour le statut localement immédiatement
    setLocalStatuses(prev => ({...prev, [id]: newStatus}));
    // Envoyer la mise à jour au serveur
    await onUpdateStatus(id, newStatus);
  };
  
  // Récupérer le statut à afficher (local s'il existe, sinon celui de la commande)
  const getDisplayStatus = (commande: Commande) => {
    return localStatuses[commande.id] || commande.statut;
  };

  // Formatter l'heure de commande
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Commandes en cours</h1>
        <Link to="/historique">
          <Button variant="outline" className="flex gap-2 items-center">
            <History size={18} />
            Historique
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {commandes.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              Aucune commande en cours
            </CardContent>
          </Card>
        ) : (
          commandes.map((commande) => {
            const displayStatus = getDisplayStatus(commande);
            
            return (
              <Card key={commande.id} className="overflow-hidden">
                <CardHeader className="pb-2 border-b">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-base font-medium">Table {commande.tables.numero}</Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock size={14} className="mr-1" />
                        {formatTime(commande.heure_commande)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CreditCard size={12} />
                        {commande.methode_paiement}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {Array.isArray(commande.details) && commande.details.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="font-medium text-base">
                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md mr-2">
                              {item.quantity}x
                            </span>
                            {item.nom}
                          </span>
                          <span className="text-green-600 font-bold">{typeof item.prix === 'number' ? item.prix.toLocaleString('fr-FR') : '0'} FCFA</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      {['en attente', 'en préparation', 'prêt', 'servi'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(commande.id, status)}
                          className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors
                            ${getStatusColor(status)} 
                            ${displayStatus === status ? 'ring-2 ring-offset-2' : 'opacity-70 hover:opacity-100'}`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Card className="mt-8 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Total journalier (commandes servies)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{totalJournalier.toLocaleString('fr-FR')} FCFA</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default KitchenOrdersList;
