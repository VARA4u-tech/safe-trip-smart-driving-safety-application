import { useState, useRef, useCallback, useEffect } from "react";
import { Search, X, MapPin, Navigation, Mic } from "lucide-react";
import mapboxgl from "mapbox-gl";
import { toast } from "sonner";

interface MapSearchBarProps {
  mapRef: React.RefObject<mapboxgl.Map | null>;
  accessToken: string;
  onNavigateTo?: (destination: {
    name: string;
    coords: [number, number];
  }) => void;
  externalQuery?: string;
  isTripActive?: boolean;
  onStartTrip?: () => void;
  onEndTrip?: () => void;
}

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
}

const MapSearchBar = ({
  mapRef,
  accessToken,
  onNavigateTo,
  externalQuery,
  isTripActive,
  onStartTrip,
  onEndTrip,
}: MapSearchBarProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${accessToken}&limit=5&types=address,poi,place`,
        );
        const data = await res.json();
        setResults(
          (data.features || []).map((f: any) => ({
            id: f.id,
            place_name: f.place_name,
            center: f.center as [number, number],
          })),
        );
      } catch {
        setResults([]);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    if (externalQuery) {
      setQuery(externalQuery);
      doSearch(externalQuery);
      setOpen(true);
    }
  }, [externalQuery, doSearch]);

  const handleChange = (val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Listening...");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      doSearch(transcript);
      setOpen(true);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      toast.error(`Error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const selectResult = (r: SearchResult, navigate = false) => {
    setQuery(r.place_name);
    setResults([]);
    setOpen(false);

    searchMarkerRef.current?.remove();

    const map = mapRef.current;
    if (!map) return;

    const el = document.createElement("div");
    el.style.cssText = `
      width: 24px; height: 24px; border-radius: 50%;
      background: hsl(32, 50%, 40%);
      border: 2.5px solid hsl(38, 30%, 92%);
      box-shadow: 0 1px 6px rgba(0,0,0,0.25);
    `;
    searchMarkerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat(r.center)
      .addTo(map);

    map.flyTo({ center: r.center, zoom: 15, duration: 1400, essential: true });

    if (navigate && onNavigateTo) {
      onNavigateTo({ name: r.place_name, coords: r.center });
      // Auto-start trip on selection
      if (onStartTrip && !isTripActive) {
        onStartTrip();
        toast.success("Trip auto-started to destination");
      }
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    searchMarkerRef.current?.remove();
    searchMarkerRef.current = null;

    if (isTripActive && onEndTrip) {
      onEndTrip();
      toast.info("Trip ended");
    }
  };

  return (
    <div className="relative w-full max-w-[280px]">
      <div
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-vintage-border-outer transition-all ${
          focused || isListening ? "ring-1 ring-primary/30" : ""
        }`}
        style={{
          background: isListening
            ? "hsl(32, 50%, 90%)"
            : "hsl(38, 30%, 93%, 0.95)",
          boxShadow:
            "inset 0 1px 2px rgba(139,115,85,0.12), 0 1px 4px rgba(0,0,0,0.1)",
        }}
      >
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => {
            setFocused(false);
            setTimeout(() => setOpen(false), 200);
          }}
          placeholder={isListening ? "Listening..." : "Search location…"}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
        />
        <div className="flex items-center gap-1.5 shink-0">
          <button
            onClick={handleVoiceSearch}
            className={`p-1 rounded-full transition-colors ${
              isListening
                ? "bg-red-500 text-white animate-pulse"
                : "hover:bg-primary/20 text-muted-foreground hover:text-primary"
            }`}
            title="Voice search"
          >
            <Mic className="w-4 h-4" />
          </button>
          {query && (
            <button
              onClick={clearSearch}
              className="p-1 hover:bg-primary/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full mt-1 left-0 right-0 rounded-xl border border-vintage-border-outer overflow-hidden z-40"
          style={{
            background: "hsl(38, 40%, 93%)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          }}
        >
          {results.map((r) => (
            <div
              key={r.id}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-secondary/40 transition-colors"
            >
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <button
                onMouseDown={() => selectResult(r, true)}
                className="flex-1 text-left min-w-0"
              >
                <span className="text-xs text-foreground truncate block">
                  {r.place_name}
                </span>
              </button>
              {onNavigateTo && (
                <button
                  onMouseDown={() => selectResult(r, true)}
                  className="shrink-0 w-7 h-7 rounded-full border border-vintage-border-outer flex items-center justify-center hover:bg-primary/10 transition-colors"
                  title="Navigate here"
                >
                  <Navigation className="w-3.5 h-3.5 text-primary" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapSearchBar;
