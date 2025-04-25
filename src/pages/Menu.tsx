
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Utensils, CupSoda } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { useIsMobile } from '@/hooks/use-mobile';

type Plat = Database['public']['Tables']['plats']['Row'];

const Menu = () => {
  const isMobile = useIsMobile();
  const [plats, setPlats] = useState<Plat[]>([]);
  const [recherche, setRecherche] = useState('');
  const [commandeActuelle, setCommandeActuelle] = useState<Plat[]>([]);
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table') || '1';
  const navigate = useNavigate();
  const [categorieSelectionnee, setCategorieSelectionnee] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    fetchPlats();
    
    // Vérifier s'il y a un panier sauvegardé pour cette table
    const savedOrder = localStorage.getItem(`panier_table_${tableId}`);
    if (savedOrder) {
      setCommandeActuelle(JSON.parse(savedOrder));
    }
    
    // Vérifier si l'utilisateur a une commande en cours
    checkActiveOrder();

    // Ajouter le détecteur de scroll pour le panier flottant
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tableId]);
  
  const checkActiveOrder = async () => {
    try {
      // D'abord récupérer l'ID de la table à partir de son numéro
      const { data: tableData } = await supabase
        .from('tables')
        .select('id')
        .eq('numero', parseInt(tableId))
        .maybeSingle();
      
      if (!tableData) return;
      
      // Vérifier s'il existe une commande active
      const { data: activeOrder } = await supabase
        .from('commandes')
        .select('id')
        .eq('table_id', tableData.id)
        .not('statut', 'eq', 'servi')
        .maybeSingle();
        
      if (activeOrder) {
        // Si une commande est en cours, rediriger vers la page de suivi
        navigate(`/suivi?table=${tableId}`);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des commandes actives:', error);
    }
  };

  const fetchPlats = async () => {
    try {
      const { data, error } = await supabase
        .from('plats')
        .select('*');
      
      if (error) throw error;
      if (data) setPlats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des plats:', error);
    }
  };

  const ajouterAuPanier = (plat: Plat) => {
    const newPanier = [...commandeActuelle, plat];
    setCommandeActuelle(newPanier);
    localStorage.setItem(`panier_table_${tableId}`, JSON.stringify(newPanier));
    toast.success(`${plat.nom} ajouté`, {
      duration: 2000,
      position: 'bottom-center',
      className: 'bg-black/80 text-white',
    });
  };

  // Filtrer les plats par recherche et catégorie
  const platsFiltrés = plats.filter(plat => {
    const matchesSearch = 
      plat.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      (plat.description && plat.description.toLowerCase().includes(recherche.toLowerCase()));
    
    // Si une catégorie est sélectionnée, filtrer par cette catégorie
    return matchesSearch && (!categorieSelectionnee || plat.categorie === categorieSelectionnee);
  });

  const platsPourCategorie = platsFiltrés.reduce((acc, plat) => {
    if (!acc[plat.categorie || 'Autres']) {
      acc[plat.categorie || 'Autres'] = [];
    }
    acc[plat.categorie || 'Autres'].push(plat);
    return acc;
  }, {} as Record<string, Plat[]>);

  const voirPanier = () => {
    navigate(`/panier?table=${tableId}`);
  };

  // Comptage des articles par plat
  const getQuantityInCart = (platId: number) => {
    return commandeActuelle.filter(p => p.id === platId).length;
  };

  // Catégories disponibles
  const categories = Array.from(new Set(plats.map(p => p.categorie || 'Autres')));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Menu - MRG RESTAU</h1>
            <h2 className="text-xl text-indigo-700">Table {tableId}</h2>
          </div>
          
          {/* Panier flottant qui suit le scroll */}
          <div className={`fixed ${scrollPosition > 100 ? 'top-4' : 'top-20'} right-4 z-30 transition-all duration-300`}>
            <Button 
              variant="default" 
              onClick={voirPanier} 
              className="relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
            >
              <ShoppingCart className="mr-2" />
              Panier
              {commandeActuelle.length > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center"
                >
                  {commandeActuelle.length}
                </Badge>
              )}
            </Button>
          </div>
        </header>
        
        <Input 
          placeholder="Rechercher un plat..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="mb-6 border-2 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
        />

        {/* Filtres de catégorie avec icônes */}
        <div className="flex justify-center gap-3 mb-8 overflow-x-auto py-2 px-1">
          <Button
            variant={categorieSelectionnee === null ? "default" : "outline"}
            onClick={() => setCategorieSelectionnee(null)}
            className={`rounded-full px-5 ${categorieSelectionnee === null ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'hover:bg-indigo-100'}`}
          >
            Tous
          </Button>
          {categories.includes('Entrées') && (
            <Button
              variant={categorieSelectionnee === 'Entrées' ? "default" : "outline"}
              onClick={() => setCategorieSelectionnee('Entrées')}
              className={`rounded-full ${categorieSelectionnee === 'Entrées' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'hover:bg-indigo-100'}`}
            >
              <Utensils className="mr-2 h-4 w-4" /> 
              Entrées
            </Button>
          )}
          {categories.includes('Plats de résistance') && (
            <Button
              variant={categorieSelectionnee === 'Plats de résistance' ? "default" : "outline"}
              onClick={() => setCategorieSelectionnee('Plats de résistance')}
              className={`rounded-full ${categorieSelectionnee === 'Plats de résistance' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'hover:bg-indigo-100'}`}
            >
              <Utensils className="mr-2 h-4 w-4" />
              Plats
            </Button>
          )}
          {categories.includes('Boissons') && (
            <Button
              variant={categorieSelectionnee === 'Boissons' ? "default" : "outline"}
              onClick={() => setCategorieSelectionnee('Boissons')}
              className={`rounded-full ${categorieSelectionnee === 'Boissons' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'hover:bg-indigo-100'}`}
            >
              <CupSoda className="mr-2 h-4 w-4" />
              Boissons
            </Button>
          )}
        </div>

        {Object.entries(platsPourCategorie).map(([categorie, platsDeCategorie]) => (
          <div key={categorie} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
              {categorie === 'Entrées' && <Utensils className="mr-2 text-indigo-600" />}
              {categorie === 'Plats de résistance' && <Utensils className="mr-2 text-indigo-600" />}
              {categorie === 'Boissons' && <CupSoda className="mr-2 text-indigo-600" />}
              {categorie}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platsDeCategorie.map((plat) => (
                <Card key={plat.id} className="overflow-hidden rounded-xl hover:shadow-lg transition-all duration-300 border-2 border-indigo-100 hover:border-indigo-300 bg-white">
                  {plat.image_url && (
                    <div className="aspect-video w-full overflow-hidden relative">
                      <img 
                        src={plat.image_url} 
                        alt={plat.nom} 
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold px-3 py-1">
                          {plat.prix.toLocaleString('fr-FR')} FCFA
                        </Badge>
                      </div>
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-indigo-800">{plat.nom}</h3>
                      
                      {/* Affichage de la quantité dans le panier */}
                      {getQuantityInCart(plat.id) > 0 && (
                        <Badge variant="secondary" className="ml-2 text-base bg-indigo-100 text-indigo-700">
                          {getQuantityInCart(plat.id)}x
                        </Badge>
                      )}
                    </div>
                    {plat.description && (
                      <p className="text-gray-600 mb-4">{plat.description}</p>
                    )}
                    {!plat.image_url && (
                      <p className="text-2xl font-bold text-green-600 mb-4">{plat.prix.toLocaleString('fr-FR')} FCFA</p>
                    )}
                    <Button 
                      onClick={() => ajouterAuPanier(plat)} 
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                    >
                      Ajouter au panier
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;
