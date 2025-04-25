
export type Plat = {
  id: number;
  nom: string;
  prix: number;
  description?: string;
  categorie?: string;
  image_url?: string;
  quantite?: number;
};

export type CommandeJour = {
  date: string;
  total: number;
  commandes: any[];
};
