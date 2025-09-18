import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Route, Search, Settings } from 'lucide-react';
import ExportImport from './ExportImport';
import { useToast } from '@/hooks/use-toast';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Node {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface Edge {
  a: string;
  b: string;
  dist: number;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
  metadata: {
    source: string;
    centerApprox: [number, number];
    overlayBounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };
}

interface RouteResult {
  path: string[];
  distance: number;
  steps: Array<{
    from: string;
    to: string;
    distance: number;
  }>;
}

const CampusMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const { toast } = useToast();

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [filteredNodes, setFilteredNodes] = useState<Node[]>([]);

  // Load graph data
  useEffect(() => {
    fetch('/data/distances.json')
      .then(response => response.json())
      .then((data: GraphData) => {
        setGraphData(data);
        toast({
          title: "Campus Data Loaded",
          description: `Loaded ${data.nodes.length} locations and ${data.edges.length} pathways`
        });
      })
      .catch(error => {
        console.error('Error loading graph data:', error);
        toast({
          title: "Error Loading Data",
          description: "Failed to load campus data. Please refresh the page.",
          variant: "destructive"
        });
      });
  }, [toast]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !graphData) return;

    // Initialize Leaflet map
    const map = L.map(mapRef.current).setView(
      graphData.metadata.centerApprox,
      16
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add markers for each node
    graphData.nodes.forEach(node => {
      const marker = L.marker([node.lat, node.lng])
        .bindPopup(`<strong>${node.name}</strong>`)
        .addTo(map);
      markersRef.current.set(node.id, marker);
    });

    return () => {
      map.remove();
    };
  }, [graphData]);

  // Search functionality
  useEffect(() => {
    if (!graphData || !searchQuery) {
      setFilteredNodes([]);
      return;
    }

    const filtered = graphData.nodes.filter(node =>
      node.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredNodes(filtered);
  }, [searchQuery, graphData]);

  // Dijkstra's algorithm implementation
  const findShortestPath = (startId: string, endId: string): RouteResult | null => {
    if (!graphData) return null;

    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    const unvisited = new Set<string>();

    // Initialize distances
    graphData.nodes.forEach(node => {
      distances[node.id] = node.id === startId ? 0 : Infinity;
      previous[node.id] = null;
      unvisited.add(node.id);
    });

    // Build adjacency list
    const adjacency: { [key: string]: Array<{ node: string; weight: number }> } = {};
    graphData.nodes.forEach(node => {
      adjacency[node.id] = [];
    });

    graphData.edges.forEach(edge => {
      adjacency[edge.a].push({ node: edge.b, weight: edge.dist });
      adjacency[edge.b].push({ node: edge.a, weight: edge.dist });
    });

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let current = Array.from(unvisited).reduce((min, node) =>
        distances[node] < distances[min] ? node : min
      );

      if (distances[current] === Infinity) break;

      unvisited.delete(current);

      if (current === endId) break;

      // Update distances to neighbors
      adjacency[current].forEach(({ node, weight }) => {
        if (unvisited.has(node)) {
          const alt = distances[current] + weight;
          if (alt < distances[node]) {
            distances[node] = alt;
            previous[node] = current;
          }
        }
      });
    }

    // Reconstruct path
    const path: string[] = [];
    let current = endId;
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }

    if (path[0] !== startId) return null;

    // Build steps
    const steps = [];
    for (let i = 0; i < path.length - 1; i++) {
      const edge = graphData.edges.find(
        e => (e.a === path[i] && e.b === path[i + 1]) || 
             (e.b === path[i] && e.a === path[i + 1])
      );
      if (edge) {
        steps.push({
          from: path[i],
          to: path[i + 1],
          distance: edge.dist
        });
      }
    }

    return {
      path,
      distance: distances[endId],
      steps
    };
  };

  const handleFindRoute = () => {
    if (!startLocation || !endLocation || !graphData) return;

    if (startLocation === endLocation) {
      toast({
        title: "Same Location",
        description: "Start and destination are the same location",
        variant: "destructive"
      });
      return;
    }

    const result = findShortestPath(startLocation, endLocation);
    
    if (!result) {
      toast({
        title: "No Route Found",
        description: "No connecting path exists between these locations",
        variant: "destructive"
      });
      return;
    }

    setRouteResult(result);

    toast({
      title: "Route Calculated",
      description: `Found route: ${result.distance}m total distance`
    });

    if (mapInstanceRef.current) {
      // Clear existing route
      if (routeLayerRef.current) {
        mapInstanceRef.current.removeLayer(routeLayerRef.current);
      }

      // Draw new route
      const routeCoords = result.path.map(nodeId => {
        const node = graphData.nodes.find(n => n.id === nodeId);
        return node ? [node.lat, node.lng] as L.LatLngExpression : null;
      }).filter(coord => coord !== null);

      if (routeCoords.length > 0) {
        const polyline = L.polyline(routeCoords, {
          color: 'hsl(142, 76%, 36%)',
          weight: 4,
          opacity: 0.8
        }).addTo(mapInstanceRef.current);

        routeLayerRef.current = polyline;
        mapInstanceRef.current.fitBounds(polyline.getBounds());
      }
    }
  };

  const handleSearchSelect = (node: Node) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([node.lat, node.lng], 18);
      const marker = markersRef.current.get(node.id);
      if (marker) {
        marker.openPopup();
      }
    }
    setSearchQuery('');
    setFilteredNodes([]);
  };

  const handleImportData = (data: GraphData) => {
    setGraphData(data);
    
    // Clear existing selections
    setStartLocation('');
    setEndLocation('');
    setRouteResult(null);
    
    // Refresh map with new data
    if (mapInstanceRef.current) {
      // Clear existing markers and routes
      markersRef.current.forEach(marker => {
        mapInstanceRef.current?.removeLayer(marker);
      });
      markersRef.current.clear();
      
      if (routeLayerRef.current) {
        mapInstanceRef.current.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
      
      // Add new markers
      data.nodes.forEach(node => {
        const marker = L.marker([node.lat, node.lng])
          .bindPopup(`<strong>${node.name}</strong>`)
          .addTo(mapInstanceRef.current!);
        markersRef.current.set(node.id, marker);
      });
    }
  };

  const getNodeName = (nodeId: string): string => {
    return graphData?.nodes.find(n => n.id === nodeId)?.name || nodeId;
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background">
      {/* Sidebar */}
      <div className="w-full lg:w-80 bg-card border-r border-border p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Chanakya University</h1>
            <p className="text-muted-foreground">Campus Navigation</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input pl-10"
            />
            {filteredNodes.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-lg mt-1 shadow-lg z-10">
                {filteredNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => handleSearchSelect(node)}
                    className="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground first:rounded-t-lg last:rounded-b-lg"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {node.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Route Planning */}
          <Card className="route-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Route Planner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Start Location</label>
                <Select value={startLocation} onValueChange={setStartLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose start point" />
                  </SelectTrigger>
                  <SelectContent>
                    {graphData?.nodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Destination</label>
                <Select value={endLocation} onValueChange={setEndLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {graphData?.nodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleFindRoute}
                disabled={!startLocation || !endLocation}
                className="navigation-button w-full"
              >
                Find Route
              </Button>
            </CardContent>
          </Card>

          {/* Route Results */}
          {routeResult && (
            <Card className="fade-in">
              <CardHeader>
                <CardTitle>Route Found</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-navigation">
                    Total Distance: {routeResult.distance}m
                  </div>
                  <div className="space-y-1">
                    {routeResult.steps.map((step, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {index + 1}. {getNodeName(step.from)} → {getNodeName(step.to)} ({step.distance}m)
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <div className="space-y-2">
            <ExportImport 
              graphData={graphData}
              onImport={handleImportData}
            />
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="map-container absolute inset-0" />
      </div>
    </div>
  );
};

export default CampusMap;