
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { Lock, Key } from 'lucide-react';

const HistoriqueAuth = () => {
  const [motDePasse, setMotDePasse] = useState('');
  const [tentatives, setTentatives] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si le code d'accès a déjà été validé
    const isAuth = sessionStorage.getItem('historiqueAuth') === 'true';
    if (isAuth) {
      navigate('/historique');
    }
  }, [navigate]);

  const authentifier = () => {
    if (motDePasse === 'Lemuel_2020') {
      // Stocker un indicateur d'authentification dans la session
      sessionStorage.setItem('historiqueAuth', 'true');
      navigate('/historique');
      toast.success('Accès autorisé');
    } else {
      // Incrémenter le compteur de tentatives
      setTentatives(prev => prev + 1);
      
      // Message d'erreur plus dissuasif après plusieurs tentatives
      if (tentatives >= 2) {
        toast.error('Accès refusé. Trop de tentatives incorrectes.');
      } else {
        toast.error('Mot de passe incorrect');
      }
      
      // Effacer le champ de mot de passe
      setMotDePasse('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      authentifier();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md border-2 border-indigo-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
          <CardTitle className="text-center flex gap-2 justify-center items-center text-white">
            <Lock size={24} />
            Accès à l'historique
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6">
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <Key className="h-12 w-12 mx-auto text-indigo-500 mb-2" />
              <p className="text-indigo-700">Veuillez entrer le code d'accès pour consulter l'historique des commandes</p>
            </div>
            
            <div className="space-y-4">
              <Input 
                type="password"
                placeholder="Code d'accès"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                onKeyDown={handleKeyDown}
                className="px-4 py-3 border-2 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
                autoFocus
              />
              <Button 
                onClick={authentifier} 
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                <Lock className="mr-2 h-4 w-4" />
                Se connecter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoriqueAuth;
