import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Menu as MenuIcon, ChefHat, Info, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

const Index = () => {
  // Générer 20 QR codes pour les tables
  const generateQRCodes = () => {
    const qrCodes = [];
    for (let i = 1; i <= 20; i++) {
      qrCodes.push(
        <Card key={i} className="text-center">
          <CardContent className="p-6">
            <div className="mb-3">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${window.location.origin}/menu?table=${i}`} 
                alt={`QR Code Table ${i}`} 
                className="mx-auto" 
              />
            </div>
            <p className="text-lg font-semibold">Table {i}</p>
            <p className="text-sm text-gray-500">Scannez-moi</p>
          </CardContent>
          <CardFooter className="pt-0 justify-center">
            <Link to={`/menu?table=${i}`} className="text-blue-600 text-sm hover:underline">
              Accéder au menu de la table {i}
            </Link>
          </CardFooter>
        </Card>
      );
    }
    return qrCodes;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1A1F2C] text-white sticky top-0 z-10">
        <nav className="container mx-auto p-4 flex justify-between items-center">
          <div className="text-xl font-bold">MRG RESTAU</div>
          <div className="flex space-x-4">
            <Link to="/" className="flex items-center space-x-2 hover:text-gray-300">
              <Home size={18} /> <span>Accueil</span>
            </Link>
            <Link to="/menu" className="flex items-center space-x-2 hover:text-gray-300">
              <MenuIcon size={18} /> <span>Menu</span>
            </Link>
            <Link to="/cuisine" className="flex items-center space-x-2 hover:text-gray-300">
              <ChefHat size={18} /> <span>Cuisine</span>
            </Link>
            <a href="#about" className="flex items-center space-x-2 hover:text-gray-300">
              <Info size={18} /> <span>À propos</span>
            </a>
            <a href="#qrcodes" className="flex items-center space-x-2 hover:text-gray-300">
              <QrCode size={18} /> <span>QR Codes</span>
            </a>
          </div>
        </nav>
      </header>
      
      <section className="py-20 bg-cover bg-center relative" style={{ backgroundImage: 'url("https://images.pexels.com/photos/6267/menu-restaurant-vintage-table.jpg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260")' }}>
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          <h1 className="text-5xl font-bold mb-4">MRG RESTAU</h1>
          <p className="text-xl mb-8">Une expérience culinaire exceptionnelle</p>
          <Link to="/menu">
            <Button size="lg" className="font-semibold">Découvrir notre menu</Button>
          </Link>
        </div>
      </section>
      
      <section id="about" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">À propos de nous</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Notre histoire</h3>
              <p className="text-gray-600 mb-6">
                Fondé en 2023, MRG RESTAU s'est rapidement imposé comme une référence de la gastronomie locale. 
                Notre passion pour les saveurs authentiques et les produits frais guide notre cuisine au quotidien.
              </p>
              <p className="text-gray-600 mb-6">
                Notre équipe dévouée travaille sans relâche pour vous offrir une expérience culinaire mémorable 
                dans un cadre chaleureux et accueillant.
              </p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <strong className="mr-2">Email:</strong>
                  <a href="mailto:mrgseller@gmail.com" className="text-blue-600">mrgseller@gmail.com</a>
                </div>
                <div className="flex items-center">
                  <strong className="mr-2">Téléphone:</strong>
                  <a href="tel:+2250544867755" className="text-blue-600">+225 05 44 86 77 55</a>
                </div>
              </div>
            </div>
            <div>
              <img 
                src="https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                alt="Notre restaurant"
                className="rounded-lg shadow-xl" 
              />
            </div>
          </div>
        </div>
      </section>

      <section id="qrcodes" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nos QR Codes</h2>
          <p className="text-center text-gray-600 mb-8">
            Scannez le QR code de votre table pour accéder facilement à notre menu et commander directement depuis votre appareil.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
            {generateQRCodes()}
          </div>
        </div>
      </section>
      
      <footer className="bg-[#1A1F2C] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">MRG RESTAU</h3>
              <p className="text-gray-300">Savourez l'excellence</p>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-300">© 2024 MRG RESTAU. Tous droits réservés.</p>
              <p className="text-gray-400">Conçu avec passion</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
