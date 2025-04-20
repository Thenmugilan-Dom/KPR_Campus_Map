
import { Room } from "@/lib/pathfinding";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Navigation, 
  CornerDownLeft, 
  ArrowRight, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown,
  RotateCw,
  User
} from "lucide-react";

interface NavigationInfoProps {
  start: Room | null;
  destination: Room | null;
  path: Room[];
  onClear: () => void;
}

// Helper function to determine direction text and icon
const getDirectionInfo = (prev: Room, current: Room) => {
  const dx = current.x - prev.x;
  const dy = current.y - prev.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Calculate actual distance between points (in pixels)
  const distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)).toFixed(0);
  
  // Determine cardinal direction based on angle
  if (angle > -45 && angle <= 45) {
    return { icon: <ArrowRight className="h-5 w-5 text-blue-600" />, text: "right", distance };
  } else if (angle > 45 && angle <= 135) {
    return { icon: <ArrowDown className="h-5 w-5 text-blue-600" />, text: "down", distance };
  } else if ((angle > 135 && angle <= 180) || (angle >= -180 && angle <= -135)) {
    return { icon: <ArrowLeft className="h-5 w-5 text-blue-600" />, text: "left", distance };
  } else {
    return { icon: <ArrowUp className="h-5 w-5 text-blue-600" />, text: "up", distance };
  }
};

// Helper to get room display name
const getRoomDisplayName = (room: Room) => {
  if (!room.name || room.name.trim() === "") {
    return room.type === "waypoint" ? "Corridor" : "Junction";
  }
  return room.name;
};

const NavigationInfo = ({
  start,
  destination,
  path,
  onClear
}: NavigationInfoProps) => {
  if (!start && !destination) {
    return (
      <div className="p-4 mt-4 bg-blue-50 text-blue-800 rounded-md">
        <p>Select a starting point on the map or use the dropdown above</p>
      </div>
    );
  }

  const renderPathInstructions = () => {
    if (!start || !destination || path.length < 2) {
      return (
        <p className="text-gray-500 italic">
          Path information will appear here
        </p>
      );
    }
    
    let stepNumber = 1;
    const steps = [];
    
    // First step - start location
    steps.push(
      <li key="start" className="text-sm py-2 border-b border-gray-100">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex-shrink-0">
            <MapPin className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">From: <span className="text-blue-700">{getRoomDisplayName(start)}</span></div>
          </div>
        </div>
      </li>
    );
    
    // Generate movement instructions
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const current = path[i];
      const direction = getDirectionInfo(prev, current);
      const isNamedLocation = current.name && current.name.trim() !== "";
      const isDestination = i === path.length - 1;
      
      if (isNamedLocation || isDestination) {
        steps.push(
          <li key={`step-${stepNumber}`} className="text-sm py-2 border-b border-gray-100">
            <div className="flex items-start gap-2">
              <div className="bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium text-gray-700 flex-shrink-0 mt-0.5">
                {stepNumber}
              </div>
              <div>
                <div className="font-medium">Go to <span className="text-blue-700">{getRoomDisplayName(current)}</span></div>
              </div>
            </div>
          </li>
        );
        stepNumber++;
      } else {
        steps.push(
          <li key={`direction-${i}`} className="text-sm py-2 border-b border-gray-100">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex-shrink-0">
                {direction.icon}
              </div>
              <div>
                <div className="font-medium">Continue <span className="text-blue-700">{direction.text}</span> for <span className="text-blue-700">{direction.distance}</span> units</div>
              </div>
            </div>
          </li>
        );
      }
    }
    
    // Final arrival step
    steps.push(
      <li key="arrival" className="text-sm py-2 flex items-center gap-2 text-green-600 font-medium">
        <Navigation className="h-5 w-5" />
        <span>You have arrived at your destination!</span>
      </li>
    );
    
    return <ol className="space-y-1">{steps}</ol>;
  };

  const renderDirectionStrip = () => {
    if (!start || !destination || path.length < 2) return null;
    
    return (
      <div className="flex overflow-x-auto py-3 px-1 gap-1 bg-gray-50 rounded-md mt-4 scrollbar-thin">
        {/* User/You icon */}
        <div className="flex-shrink-0 flex flex-col items-center px-3">
          <User className="h-6 w-6 text-orange-500" />
          <div className="text-xs font-medium">You</div>
        </div>
        
        {/* Direction arrows */}
        {path.map((point, index) => {
          if (index === 0) return null; // Skip first point (starting point)
          
          const prev = path[index - 1];
          const direction = getDirectionInfo(prev, point);
          const isDestination = index === path.length - 1;
          const displayName = point.name && point.name.trim() !== "" ? point.name : null;
          
          return (
            <div key={`direction-${index}`} className="flex-shrink-0 flex flex-col items-center">
              {/* Connecting line */}
              <div className="h-px w-8 bg-blue-400 self-center mt-3"></div>
              
              {/* Direction icon */}
              <div className={`rounded-full p-1.5 ${isDestination ? 'bg-red-100' : 'bg-blue-100'}`}>
                {isDestination ? (
                  <Navigation className="h-4 w-4 text-red-600" />
                ) : (
                  direction.icon
                )}
              </div>
              
              {/* Direction label */}
              {displayName ? (
                <div className="text-[10px] w-16 text-center truncate" title={displayName}>
                  {displayName}
                </div>
              ) : (
                <div className="text-[10px] w-12 text-center">
                  {direction.text}
                </div>
              )}
              
              {/* Distance for non-destinations */}
              {!isDestination && (
                <div className="text-[10px] text-gray-500">
                  {direction.distance}u
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mt-4 space-y-3">
      {/* Summary box */}
      <div className="bg-blue-50 p-4 rounded-md space-y-2">
        {start && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-sm">
              From: <strong>{getRoomDisplayName(start)}</strong>
            </span>
          </div>
        )}
        
        {destination && (
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-red-600" />
            <span className="text-sm">
              To: <strong>{getRoomDisplayName(destination)}</strong>
            </span>
          </div>
        )}

        {path.length > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <RotateCw className="h-4 w-4 text-gray-600" />
            <span>Total waypoints: <strong>{path.length}</strong></span>
          </div>
        )}
      </div>
      
      {/* Simplified direction strip with arrows */}
      {path.length > 1 && renderDirectionStrip()}
      
      {/* Detailed turn-by-turn directions */}
      {path.length > 1 && (
        <div>
          <h3 className="font-medium mb-2">Directions:</h3>
          {renderPathInstructions()}
        </div>
      )}
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onClear}
        className="w-full mt-2"
      >
        Clear Navigation
      </Button>
    </div>
  );
};

export default NavigationInfo;
