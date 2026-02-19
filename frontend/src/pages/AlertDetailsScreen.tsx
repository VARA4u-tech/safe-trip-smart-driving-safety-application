import { useParams, useNavigate } from "react-router-dom";
import VintageLayout from "@/components/VintageLayout";
import VintageFrame from "@/components/VintageFrame";
import { mockAlerts } from "@/data/mockData";
import {
  ArrowLeft, AlertTriangle, CloudRain, Construction, CarFront,
  MapPin, Clock, Shield,
} from "lucide-react";

const alertIcons = {
  Accident: CarFront,
  Traffic: Construction,
  Weather: CloudRain,
  "Road Block": AlertTriangle,
};

const AlertDetailsScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const alert = mockAlerts.find((a) => a.id === id);

  if (!alert) {
    return (
      <VintageLayout>
        <div className="w-full max-w-lg mx-auto text-center py-20">
          <p className="text-muted-foreground">Alert not found.</p>
          <button onClick={() => navigate(-1)} className="vintage-btn mt-4">Go Back</button>
        </div>
      </VintageLayout>
    );
  }

  const Icon = alertIcons[alert.type];

  return (
    <VintageLayout>
      <div className="w-full max-w-lg mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full border border-border flex items-center justify-center bg-vintage-parchment/60 hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-heading text-xl font-bold text-foreground">Alert Details</h1>
        </div>

        <VintageFrame className={`mb-4 severity-${alert.severity}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center bg-secondary/60">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">{alert.title}</h2>
              <span className="text-sm text-muted-foreground uppercase tracking-wide">{alert.type}</span>
            </div>
          </div>

          <div className="vintage-divider" />

          <p className="text-foreground my-4">{alert.description}</p>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{alert.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Detected: {alert.timeDetected}</span>
            </div>
          </div>
        </VintageFrame>

        <VintageFrame>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-semibold text-foreground">Recommended Action</h3>
          </div>
          <p className="text-muted-foreground text-sm">{alert.recommendedAction}</p>
        </VintageFrame>
      </div>
    </VintageLayout>
  );
};

export default AlertDetailsScreen;
