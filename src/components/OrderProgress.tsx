
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Loader2, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

type OrderStatus = 'en attente' | 'en préparation' | 'prêt' | 'servi';

interface OrderProgressProps {
  status: OrderStatus;
}

const OrderProgress = ({ status }: OrderProgressProps) => {
  const [progressValue, setProgressValue] = useState(0);
  const [displayStatus, setDisplayStatus] = useState(status);
  
  useEffect(() => {
    // Mettre à jour immédiatement pour l'interface utilisateur
    setDisplayStatus(status);
    setProgressValue(getProgressValueByStatus(status));
  }, [status]);
  
  const getProgressValueByStatus = (statusValue: OrderStatus): number => {
    switch(statusValue) {
      case 'en attente': return 25;
      case 'en préparation': return 50;
      case 'prêt': return 75;
      case 'servi': return 100;
      default: return 0;
    }
  };

  const renderStatusIcon = () => {
    switch(displayStatus) {
      case 'en attente':
        return <Badge variant="destructive" className="flex gap-1 items-center"><Clock size={14} /> En attente</Badge>;
      case 'en préparation':
        return <Badge variant="secondary" className="flex gap-1 items-center"><Loader2 size={14} className="animate-spin" /> En préparation</Badge>;
      case 'prêt':
        return <Badge variant="default" className="flex gap-1 items-center"><CheckCircle size={14} /> Prêt</Badge>;
      case 'servi':
        return <Badge variant="outline" className="flex gap-1 items-center"><CheckCircle size={14} /> Servi</Badge>;
      default:
        return <Badge variant="outline">{displayStatus}</Badge>;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        {renderStatusIcon()}
        <span className="text-sm text-gray-500">{progressValue}%</span>
      </div>
      <Progress value={progressValue} className="h-2" />
    </div>
  );
};

export default OrderProgress;
