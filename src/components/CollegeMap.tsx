import { useRef, useEffect, useState } from "react";
import { Room } from "@/lib/pathfinding";
import { cn } from "@/lib/utils";
import { MapPin, Navigation, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface CollegeMapProps {
  rooms: Room[];
  selectedStart: Room | null;
  selectedDestination: Room | null;
  path: Room[];
  onRoomClick: (room: Room) => void;
}

const CollegeMap = ({
  rooms,
  selectedStart,
  selectedDestination,
  path,
  onRoomClick,
}: CollegeMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [userPosition, setUserPosition] = useState<{x: number, y: number} | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const preloadImage = new Image();
    preloadImage.src = "/lovable-uploads/869cfbb7-7043-4b0b-97be-49875acf0122.png";
    preloadImage.onload = () => {
      setIsMapLoaded(true);
    };
  }, []);

  useEffect(() => {
    const mapContainer = mapContainerRef.current;
    const canvas = canvasRef.current;
    
    if (!mapContainer || !canvas || !isMapLoaded) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const blueprintImage = new Image();
    blueprintImage.src = "/lovable-uploads/869cfbb7-7043-4b0b-97be-49875acf0122.png";
    
    blueprintImage.onload = () => {
      canvas.width = blueprintImage.width;
      canvas.height = blueprintImage.height;
      
      setMapSize({
        width: blueprintImage.width,
        height: blueprintImage.height
      });
      
      setPosition({
        x: (mapContainer.offsetWidth - blueprintImage.width * scale) / 2,
        y: (mapContainer.offsetHeight - blueprintImage.height * scale) / 2,
      });
      
      if (selectedStart) {
        setUserPosition({
          x: selectedStart.x,
          y: selectedStart.y
        });
      } else {
        setUserPosition({
          x: blueprintImage.width / 2,
          y: blueprintImage.height / 2
        });
      }
      
      drawMap();
    };
  }, [selectedStart, scale, isMapLoaded]);

  useEffect(() => {
    const handleResize = () => {
      const mapContainer = mapContainerRef.current;
      if (!mapContainer || !mapSize.width) return;

      setPosition({
        x: (mapContainer.offsetWidth - mapSize.width * scale) / 2,
        y: (mapContainer.offsetHeight - mapSize.height * scale) / 2,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mapSize, scale]);

  useEffect(() => {
    drawMap();
  }, [selectedStart, selectedDestination, path, scale, position, userPosition, hoveredRoom, isMapLoaded]);

  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas || !isMapLoaded) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw blueprint background
    const blueprintImage = new Image();
    blueprintImage.src = "/lovable-uploads/869cfbb7-7043-4b0b-97be-49875acf0122.png";
    ctx.drawImage(blueprintImage, 0, 0, canvas.width, canvas.height);
    
    // Draw all waypoints first (as small dots)
    rooms.forEach((room) => {
      if (room.type === "waypoint") {
        ctx.beginPath();
        ctx.fillStyle = "rgba(107, 114, 128, 0.3)";
        ctx.arc(room.x, room.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
    
    // Draw connections between rooms
    rooms.forEach((room) => {
      room.connections.forEach((connectionId) => {
        const connectedRoom = rooms.find(r => r.id === connectionId);
        if (connectedRoom) {
          ctx.beginPath();
          ctx.strokeStyle = "rgba(107, 114, 128, 0.15)";
          ctx.lineWidth = 1;
          ctx.moveTo(room.x, room.y);
          ctx.lineTo(connectedRoom.x, connectedRoom.y);
          ctx.stroke();
        }
      });
    });
    
    if (path.length > 1) {
      // Draw path as orthogonal segments (Manhattan-style)
      ctx.beginPath();
      ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
      ctx.lineWidth = 16;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      for (let i = 0; i < path.length - 1; i++) {
        const start = path[i];
        const end = path[i + 1];
        
        // Draw an L-shaped path segment
        ctx.moveTo(start.x, start.y);
        
        // Check if this is a diagonal segment
        if (Math.abs(start.x - end.x) > 10 && Math.abs(start.y - end.y) > 10) {
          // Draw as an L-shape (horizontal then vertical)
          ctx.lineTo(end.x, start.y);
          ctx.lineTo(end.x, end.y);
        } else {
          // Draw direct line for mostly horizontal or vertical segments
          ctx.lineTo(end.x, end.y);
        }
      }
      
      ctx.stroke();
      
      // Draw path foreground (thinner line)
      ctx.beginPath();
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      for (let i = 0; i < path.length - 1; i++) {
        const start = path[i];
        const end = path[i + 1];
        
        // Draw an L-shaped path segment
        ctx.moveTo(start.x, start.y);
        
        // Check if this is a diagonal segment
        if (Math.abs(start.x - end.x) > 10 && Math.abs(start.y - end.y) > 10) {
          // Draw as an L-shape (horizontal then vertical)
          ctx.lineTo(end.x, start.y);
          ctx.lineTo(end.x, end.y);
        } else {
          // Draw direct line for mostly horizontal or vertical segments
          ctx.lineTo(end.x, end.y);
        }
      }
      
      ctx.stroke();
    }
    
    // Draw all rooms and important locations
    rooms.forEach((room) => {
      if (room.type !== "waypoint") {
        const isStart = selectedStart?.id === room.id;
        const isDestination = selectedDestination?.id === room.id;
        const isOnPath = path.some((pathRoom) => pathRoom.id === room.id);
        const isHovered = hoveredRoom?.id === room.id;
        
        // Draw all room points with improved visibility
        ctx.beginPath();
        
        if (isStart) {
          // Start point styling
          const labelText = "START";
          ctx.font = "bold 18px Arial";
          ctx.fillStyle = "#3b82f6";
          ctx.textAlign = "center";
          ctx.fillText(labelText, room.x, room.y - 30);
          
          ctx.fillStyle = "#3b82f6";
          ctx.arc(room.x, room.y, isHovered ? 14 : 12, 0, 2 * Math.PI);
        } else if (isDestination) {
          // Destination point styling
          const labelText = "DESTINATION";
          ctx.font = "bold 18px Arial";
          ctx.fillStyle = "#ef4444";
          ctx.textAlign = "center";
          ctx.fillText(labelText, room.x, room.y - 30);
          
          ctx.fillStyle = "#ef4444";
          ctx.arc(room.x, room.y, isHovered ? 14 : 12, 0, 2 * Math.PI);
        } else if (isOnPath) {
          // Path point styling
          ctx.fillStyle = isHovered ? "#a855f7" : "#8b5cf6";
          ctx.arc(room.x, room.y, isHovered ? 12 : 10, 0, 2 * Math.PI);
        } else {
          // Regular room point styling - more visible now
          ctx.fillStyle = isHovered ? "rgba(107, 114, 128, 0.9)" : "rgba(107, 114, 128, 0.7)";
          ctx.arc(room.x, room.y, isHovered ? 9 : 7, 0, 2 * Math.PI);
        }
        
        ctx.fill();
        
        // Add white center to all room points for better visibility
        ctx.beginPath();
        ctx.fillStyle = "#ffffff";
        
        if (isStart || isDestination) {
          ctx.arc(room.x, room.y, 6, 0, 2 * Math.PI);
        } else if (isOnPath) {
          ctx.arc(room.x, room.y, 4, 0, 2 * Math.PI);
        } else {
          // Regular rooms get smaller white center
          ctx.arc(room.x, room.y, 3, 0, 2 * Math.PI);
        }
        
        ctx.fill();
        
        // Always show room name if hovered
        if (isHovered && room.name) {
          ctx.font = "bold 16px Arial";
          ctx.fillStyle = "#000000";
          ctx.textAlign = "center";
          
          const textWidth = ctx.measureText(room.name).width;
          const padding = 6;
          
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.fillRect(
            room.x - textWidth/2 - padding,
            room.y - 30 - padding,
            textWidth + padding * 2,
            24
          );
          
          ctx.fillStyle = "#000000";
          ctx.fillText(room.name, room.x, room.y - 20);
        }
        // Show permanent labels for important points in path
        else if (isStart || isDestination || (isOnPath && (room.type === "room" || room.type === "entrance" || room.type === "stairs"))) {
          ctx.font = "bold 14px Arial";
          ctx.fillStyle = "#000000";
          ctx.textAlign = "center";
          
          const textWidth = ctx.measureText(room.name).width;
          const padding = 4;
          
          if (!(isStart || isDestination)) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.fillRect(
              room.x - textWidth/2 - padding,
              room.y - 20 - padding,
              textWidth + padding * 2,
              20
            );
            
            ctx.fillStyle = "#000000";
            ctx.fillText(room.name, room.x, room.y - 10);
          }
        }
        // Add small name label for notable locations even when not on path
        else if (room.type === "entrance" || room.type === "stairs") {
          ctx.font = "12px Arial";
          ctx.fillStyle = "#000000";
          ctx.textAlign = "center";
          
          const textWidth = ctx.measureText(room.name).width;
          const padding = 3;
          
          ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
          ctx.fillRect(
            room.x - textWidth/2 - padding,
            room.y - 20 - padding,
            textWidth + padding * 2,
            18
          );
          
          ctx.fillStyle = "#000000";
          ctx.fillText(room.name, room.x, room.y - 10);
        }
      }
    });

    if (userPosition) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(249, 115, 22, 0.3)";
      ctx.arc(userPosition.x, userPosition.y, 15, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.beginPath();
      ctx.fillStyle = "#f97316";
      ctx.arc(userPosition.x, userPosition.y, 10, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.beginPath();
      ctx.fillStyle = "#ffffff";
      ctx.arc(userPosition.x, userPosition.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      const isAtPoint = (selectedStart && 
        Math.abs(userPosition.x - selectedStart.x) < 10 && 
        Math.abs(userPosition.y - selectedStart.y) < 10) || 
        (selectedDestination && 
         Math.abs(userPosition.x - selectedDestination.x) < 10 && 
         Math.abs(userPosition.y - selectedDestination.y) < 10);
      
      if (!isAtPoint) {
        const youAreHereText = "You are here";
        ctx.font = "bold 14px Arial";
        
        const textWidth = ctx.measureText(youAreHereText).width;
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillRect(
          userPosition.x - textWidth/2 - 5,
          userPosition.y - 35,
          textWidth + 10,
          22
        );
        
        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.fillText(youAreHereText, userPosition.x, userPosition.y - 20);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleHoverCheck(e);
    
    if (!dragging) return;
    
    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    
    setPosition(newPosition);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - position.x, 
        y: e.touches[0].clientY - position.y 
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging || e.touches.length !== 1) return;
    
    const newPosition = {
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    };
    
    setPosition(newPosition);
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    setDragging(false);
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleHoverCheck = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - position.x) / scale;
    const y = (e.clientY - rect.top - position.y) / scale;
    
    const roomUnderMouse = rooms.find(room => {
      const distance = Math.sqrt(Math.pow(room.x - x, 2) + Math.pow(room.y - y, 2));
      return distance < 15 && room.type !== "waypoint";
    });
    
    setHoveredRoom(roomUnderMouse || null);
  };

  const handleMouseLeave = () => {
    setDragging(false);
    setHoveredRoom(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newScale = scale - e.deltaY * 0.001;
    setScale(Math.min(Math.max(0.5, newScale), 3));
  };

  const handleMapClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - position.x) / scale;
    const y = (e.clientY - rect.top - position.y) / scale;
    
    setUserPosition({ x, y });
    
    const clickedRoom = rooms.find(room => {
      const distance = Math.sqrt(Math.pow(room.x - x, 2) + Math.pow(room.y - y, 2));
      return distance < 15 && room.type !== "waypoint";
    });
    
    if (clickedRoom) {
      onRoomClick(clickedRoom);
    }
  };

  const zoomIn = () => setScale(Math.min(scale + 0.1, 3));
  const zoomOut = () => setScale(Math.max(scale - 0.1, 0.5));
  const resetZoom = () => {
    setScale(1);
    const mapContainer = mapContainerRef.current;
    if (!mapContainer || !mapSize.width) return;
    
    setPosition({
      x: (mapContainer.offsetWidth - mapSize.width) / 2,
      y: (mapContainer.offsetHeight - mapSize.height) / 2,
    });
  };

  return (
    <div 
      ref={mapContainerRef}
      className="relative w-full h-full bg-gray-900 overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onClick={handleMapClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-white">Loading map...</p>
          </div>
        </div>
      )}
      
      <div
        className={cn(
          "absolute transition-transform", 
          dragging ? "cursor-grabbing" : "cursor-grab",
          !isMapLoaded && "opacity-0"
        )}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        <canvas ref={canvasRef} />
      </div>
      
      <div className="absolute bottom-4 right-4 bg-gray-800/90 backdrop-blur-sm rounded-md shadow-md p-2 flex gap-1">
        <button 
          className="p-2 hover:bg-gray-700 rounded-md w-8 h-8 flex items-center justify-center text-white"
          onClick={zoomIn}
          aria-label="Zoom in"
        >
          +
        </button>
        <button 
          className="p-2 hover:bg-gray-700 rounded-md w-8 h-8 flex items-center justify-center text-white"
          onClick={zoomOut}
          aria-label="Zoom out"
        >
          -
        </button>
        <button 
          className="p-2 hover:bg-gray-700 rounded-md w-8 h-8 flex items-center justify-center text-white"
          onClick={resetZoom}
          aria-label="Reset zoom"
        >
          ↺
        </button>
      </div>
      
      <div className="absolute top-4 left-4 bg-gray-800/80 backdrop-blur-sm rounded-md shadow-md p-3 text-sm space-y-1 text-white">
        {selectedStart && (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span>Start: {selectedStart.name}</span>
          </div>
        )}
        
        {selectedDestination && (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span>Destination: {selectedDestination.name}</span>
          </div>
        )}
        
        {userPosition && (
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
            <span>{isMobile ? "Tap" : "Hover"} on any point to see details</span>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 p-2 bg-gray-800/80 backdrop-blur-sm rounded-md text-xs text-gray-300">
        Offline Map
      </div>
    </div>
  );
};

export default CollegeMap;
