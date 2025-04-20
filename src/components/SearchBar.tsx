
import { useState } from "react";
import { Room } from "@/lib/pathfinding";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";

interface SearchBarProps {
  rooms: Room[];
  onSelectStart: (room: Room) => void;
  onSelectDestination: (room: Room) => void;
}

const SearchBar = ({ rooms, onSelectStart, onSelectDestination }: SearchBarProps) => {
  const [startRoomId, setStartRoomId] = useState<string>("");
  const [destinationRoomId, setDestinationRoomId] = useState<string>("");
  
  const handleStartSelect = (value: string) => {
    setStartRoomId(value);
    const room = rooms.find(r => r.id === value);
    if (room) {
      onSelectStart(room);
    }
  };
  
  const handleDestinationSelect = (value: string) => {
    setDestinationRoomId(value);
    const room = rooms.find(r => r.id === value);
    if (room) {
      onSelectDestination(room);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1 text-gray-200">
          <MapPin className="h-4 w-4 text-blue-400" />
          Starting Point
        </label>
        <Select value={startRoomId} onValueChange={handleStartSelect}>
          <SelectTrigger className="bg-gray-700 border-gray-600">
            <SelectValue placeholder="Select starting point" />
          </SelectTrigger>
          <SelectContent>
            {rooms.sort((a, b) => a.name.localeCompare(b.name)).map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1 text-gray-200">
          <Navigation className="h-4 w-4 text-red-400" />
          Destination
        </label>
        <Select value={destinationRoomId} onValueChange={handleDestinationSelect}>
          <SelectTrigger className="bg-gray-700 border-gray-600">
            <SelectValue placeholder="Select destination" />
          </SelectTrigger>
          <SelectContent>
            {rooms.sort((a, b) => a.name.localeCompare(b.name)).map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SearchBar;
