
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import CollegeMap from "@/components/CollegeMap";
import SearchBar from "@/components/SearchBar";
import NavigationInfo from "@/components/NavigationInfo";
import { Room, getShortestPath } from "@/lib/pathfinding";
import { allRooms } from "@/data/roomData";
import { ChevronLeft, ChevronRight, MapPin, Navigation } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [selectedStart, setSelectedStart] = useState<Room | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Room | null>(null);
  const [path, setPath] = useState<Room[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  
  // Auto-close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);
  
  const handleStartSelect = (room: Room) => {
    setSelectedStart(room);
    if (selectedDestination) {
      const newPath = getShortestPath(room, selectedDestination, allRooms);
      setPath(newPath);
    }
  };
  
  const handleDestinationSelect = (room: Room) => {
    setSelectedDestination(room);
    if (selectedStart) {
      const newPath = getShortestPath(selectedStart, room, allRooms);
      setPath(newPath);
    }
  };
  
  const handleRoomClick = (room: Room) => {
    if (!selectedStart) {
      handleStartSelect(room);
    } else if (!selectedDestination) {
      handleDestinationSelect(room);
    } else {
      // Reset and set as new starting point
      setSelectedDestination(null);
      setPath([]);
      handleStartSelect(room);
    }
  };
  
  const clearNavigation = () => {
    setSelectedStart(null);
    setSelectedDestination(null);
    setPath([]);
  };

  // Calculate total path distance
  const calculateTotalDistance = () => {
    if (path.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i-1].x;
      const dy = path[i].y - path[i-1].y;
      totalDistance += Math.sqrt(dx*dx + dy*dy);
    }
    
    return Math.round(totalDistance);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 text-white py-2 px-4 shadow-lg z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center">
            <MapPin className="mr-2" />
            College Blueprint Navigator
          </h1>
          {!isMobile && (
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md text-sm flex items-center"
            >
              {sidebarOpen ? <ChevronLeft className="mr-1 h-4 w-4" /> : <ChevronRight className="mr-1 h-4 w-4" />}
              {sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
            </button>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow flex relative">
        {/* Sidebar (absolute on mobile, fixed in layout on desktop) */}
        <div 
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            transition-transform duration-300 ease-in-out
            ${isMobile ? 'absolute top-0 left-0 z-30 h-full' : 'w-72'}
            bg-gray-800 border-r border-gray-700`}
        >
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-medium">Navigation</h2>
              {isMobile && (
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded hover:bg-gray-700"
                >
                  <ChevronLeft />
                </button>
              )}
            </div>
            
            <Card className="p-4 bg-gray-700 border-gray-600">
              <SearchBar 
                rooms={allRooms.filter(r => r.type !== "waypoint" && r.name && r.name.trim() !== "")} 
                onSelectStart={handleStartSelect}
                onSelectDestination={handleDestinationSelect}
              />
              <NavigationInfo
                start={selectedStart}
                destination={selectedDestination}
                path={path}
                onClear={clearNavigation}
              />
            </Card>
            
            <Card className="p-4 bg-gray-700 border-gray-600">
              <h2 className="text-lg font-medium mb-2">How to Use</h2>
              <ul className="text-sm space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>{isMobile ? "Tap" : "Click"} a room to set starting point</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>{isMobile ? "Tap" : "Click"} another room to set destination</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>{isMobile ? "Touch and drag" : "Drag"} to pan the map</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>Use buttons or pinch to zoom in/out</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>{isMobile ? "Tap" : "Hover"} on any room to see its name</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
        
        {/* Map container - takes full width/height when sidebar is closed */}
        <div className="flex-grow relative h-[calc(100vh-58px)]">
          {/* Mobile sidebar toggle button */}
          {isMobile && !sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(true)}
              className="absolute top-4 left-4 z-20 p-2 bg-gray-800/90 rounded-full shadow-lg"
              aria-label="Open sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          
          <CollegeMap
            rooms={allRooms}
            selectedStart={selectedStart}
            selectedDestination={selectedDestination}
            path={path}
            onRoomClick={handleRoomClick}
          />
          
          {/* Navigation title beneath map on mobile */}
          {selectedStart && selectedDestination && path.length > 0 && isMobile && (
            <div className="absolute bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm py-2 px-4 text-center">
              <h2 className="text-lg font-medium flex items-center justify-center">
                <Navigation className="mr-2 h-4 w-4" />
                {selectedStart.name} → {selectedDestination.name}
              </h2>
              <p className="text-xs text-gray-300 mt-1">
                {path.length} waypoints • {calculateTotalDistance()} units total distance
              </p>
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-gray-800 text-center text-xs text-gray-400 py-2">
        <p>College Blueprint Navigator - Works 100% Offline</p>
      </footer>
    </div>
  );
};

export default Index;
