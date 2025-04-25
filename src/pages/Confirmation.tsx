
import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ListOrdered } from 'lucide-react';

const Confirmation = () => {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table') || '1';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-2" />
          <CardTitle className="text-2xl">Commande confirmée</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            Votre commande a été transmise à la cuisine et sera préparée dans les plus brefs délais.
          </p>
          <p className="font-medium">Table {tableId}</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Link to={`/suivi?table=${tableId}`} className="w-full">
            <Button className="w-full flex gap-2 items-center">
              <ListOrdered size={18} />
              Suivre ma commande
            </Button>
          </Link>
          <Link to={`/menu?table=${tableId}`} className="w-full">
            <Button variant="outline" className="w-full">Retourner au menu</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Confirmation;
