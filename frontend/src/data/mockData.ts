export interface Alert {
  id: string;
  type: "Accident" | "Traffic" | "Weather" | "Road Block";
  title: string;
  description: string;
  location: string;
  timeDetected: string;
  severity: "high" | "medium" | "low";
  recommendedAction: string;
}

export interface Trip {
  id: string;
  date: string;
  distance: string;
  duration: string;
  alertCount: number;
  startLocation: string;
  endLocation: string;
}

export const mockAlerts: Alert[] = [
  {
    id: "1",
    type: "Accident",
    title: "Multi-Vehicle Collision",
    description: "A 3-car collision reported on the highway causing major delays.",
    location: "Highway 101, Mile 42",
    timeDetected: "10 min ago",
    severity: "high",
    recommendedAction: "Take alternate route via Exit 40. Expect 25 min delay.",
  },
  {
    id: "2",
    type: "Traffic",
    title: "Heavy Congestion Ahead",
    description: "Slow traffic due to construction zone reducing lanes.",
    location: "Main Street & 5th Avenue",
    timeDetected: "5 min ago",
    severity: "medium",
    recommendedAction: "Reduce speed. Consider side streets.",
  },
  {
    id: "3",
    type: "Weather",
    title: "Fog Advisory",
    description: "Dense fog reducing visibility to under 200 meters.",
    location: "Coastal Highway, Sector B",
    timeDetected: "20 min ago",
    severity: "medium",
    recommendedAction: "Use low-beam headlights. Reduce speed to 40 km/h.",
  },
  {
    id: "4",
    type: "Road Block",
    title: "Road Closed for Repairs",
    description: "Full road closure due to water main repair work.",
    location: "Oak Boulevard, Block 12",
    timeDetected: "1 hour ago",
    severity: "low",
    recommendedAction: "Detour via Elm Street. Expected reopening at 6 PM.",
  },
];

export const mockTrips: Trip[] = [
  { id: "1", date: "Feb 10, 2026", distance: "45.2 km", duration: "52 min", alertCount: 3, startLocation: "Downtown", endLocation: "Airport" },
  { id: "2", date: "Feb 9, 2026", distance: "12.8 km", duration: "22 min", alertCount: 1, startLocation: "Home", endLocation: "Office" },
  { id: "3", date: "Feb 8, 2026", distance: "78.5 km", duration: "1h 15min", alertCount: 5, startLocation: "City Center", endLocation: "Beach Resort" },
  { id: "4", date: "Feb 7, 2026", distance: "8.3 km", duration: "18 min", alertCount: 0, startLocation: "Mall", endLocation: "Home" },
  { id: "5", date: "Feb 5, 2026", distance: "32.1 km", duration: "40 min", alertCount: 2, startLocation: "University", endLocation: "Library" },
];
