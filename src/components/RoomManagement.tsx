import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bed, Plus, Edit, Trash2, Building } from 'lucide-react';
import { formatCurrency } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';

interface Room {
  id: string;
  room_number: string;
  type: string;
  bed_count: number;
  occupied_beds: number;
  price_per_day: number;
  department: string;
  active: boolean;
}

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [newRoom, setNewRoom] = useState({
    room_number: '',
    type: 'General',
    bed_count: 1,
    price_per_day: 1000,
    department: 'General Medicine',
    active: true
  });

  const roomTypes = ['General', 'Private', 'ICU', 'Emergency'];
  const departments = [
    'General Medicine',
    'Pediatrics',
    'Orthopedics',
    'Gynecology',
    'Cardiology',
    'Emergency',
    'Surgery'
  ];

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await db.rooms.getAll();
      if (error) {
        console.error('Error fetching rooms:', error);
        toast.error('Failed to load rooms');
        return;
      }
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load rooms');
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rooms.some(room => room.room_number === newRoom.room_number)) {
      toast.error('Room number already exists');
      return;
    }

    setLoading(true);
    try {
      const roomData = {
        room_number: newRoom.room_number,
        type: newRoom.type,
        bed_count: newRoom.bed_count,
        occupied_beds: 0,
        price_per_day: newRoom.price_per_day,
        department: newRoom.department,
        active: true
      };

      const { data, error } = await db.rooms.create(roomData);
      
      if (error) {
        console.error('Error creating room:', error);
        toast.error('Failed to add room');
        setLoading(false);
        return;
      }

      setRooms([...rooms, data]);
      toast.success('Room added successfully!');
      
      setNewRoom({
        room_number: '',
        type: 'General',
        bed_count: 1,
        price_per_day: 1000,
        department: 'General Medicine',
        active: true
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to add room');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setNewRoom({
      room_number: room.room_number,
      type: room.type,
      bed_count: room.bed_count,
      price_per_day: room.price_per_day,
      department: room.department,
      active: room.active
    });
    setShowAddForm(true);
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingRoom) {
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        room_number: newRoom.room_number,
        type: newRoom.type,
        bed_count: newRoom.bed_count,
        price_per_day: newRoom.price_per_day,
        department: newRoom.department,
        active: newRoom.active
      };

      const { data, error } = await db.rooms.update(editingRoom.id, updateData);
      
      if (error) {
        console.error('Error updating room:', error);
        toast.error('Failed to update room');
        setLoading(false);
        return;
      }

      const updatedRooms = rooms.map(room => 
        room.id === editingRoom.id ? data : room
      );
      setRooms(updatedRooms);
      toast.success('Room updated successfully!');
      
      setNewRoom({
        room_number: '',
        type: 'General',
        bed_count: 1,
        price_per_day: 1000,
        department: 'General Medicine',
        active: true
      });
      setShowAddForm(false);
      setEditingRoom(null);
    } catch (error) {
      console.error('Error updating room:', error);
      toast.error('Failed to update room');
    } finally {
      setLoading(false);
    }
  };

  const toggleRoomStatus = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    try {
      const { error } = await db.rooms.update(roomId, { active: !room.active });
      
      if (error) {
        console.error('Error updating room status:', error);
        toast.error('Failed to update room status');
        return;
      }

      const updatedRooms = rooms.map(r => 
        r.id === roomId ? { ...r, active: !r.active } : r
      );
      setRooms(updatedRooms);
      toast.success(`Room ${room.room_number} ${!room.active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating room status:', error);
      toast.error('Failed to update room status');
    }
  };

  const deleteRoom = async (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    if (room.occupied_beds > 0) {
      toast.error('Cannot delete room with occupied beds');
      return;
    }

    if (!confirm(`Are you sure you want to delete room ${room.room_number}?`)) {
      return;
    }

    try {
      const { error } = await db.rooms.delete(roomId);
      
      if (error) {
        console.error('Error deleting room:', error);
        toast.error('Failed to delete room');
        return;
      }

      const updatedRooms = rooms.filter(r => r.id !== roomId);
      setRooms(updatedRooms);
      toast.success('Room deleted successfully!');
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
    }
  };

  const getOccupancyColor = (room: Room) => {
    const percentage = (room.occupied_beds / room.bed_count) * 100;
    if (percentage === 0) return 'bg-green-100 text-green-800';
    if (percentage < 50) return 'bg-blue-100 text-blue-800';
    if (percentage < 100) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Room Management
            </div>
            <Button onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingRoom(null);
              setNewRoom({
                room_number: '',
                type: 'General',
                bed_count: 1,
                price_per_day: 1000,
                department: 'General Medicine',
                active: true
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <form onSubmit={editingRoom ? handleUpdateRoom : handleAddRoom} className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="roomNumber">Room Number</Label>
                  <Input
                    id="roomNumber"
                    value={newRoom.room_number}
                    onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                    placeholder="e.g., G-101"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Room Type</Label>
                  <Select value={newRoom.type} onValueChange={(value) => setNewRoom({ ...newRoom, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedCount">Number of Beds</Label>
                  <Input
                    id="bedCount"
                    type="number"
                    min="1"
                    value={newRoom.bed_count}
                    onChange={(e) => setNewRoom({ ...newRoom, bed_count: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="pricePerDay">Price per Day (Rs)</Label>
                  <Input
                    id="pricePerDay"
                    type="number"
                    min="0"
                    value={newRoom.price_per_day}
                    onChange={(e) => setNewRoom({ ...newRoom, price_per_day: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={newRoom.department} onValueChange={(value) => setNewRoom({ ...newRoom, department: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingRoom ? 'Update Room' : 'Add Room')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingRoom(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Card key={room.id} className={`p-4 ${!room.active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{room.room_number}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {room.type}
                      </Badge>
                      <Badge variant={room.active ? 'default' : 'secondary'} className="text-xs">
                        {room.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium">{room.department}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price/Day:</span>
                    <span className="font-medium">{formatCurrency(room.price_per_day)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Beds:</span>
                    <span className="font-medium">{room.bed_count}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Occupancy:</span>
                    <Badge className={getOccupancyColor(room)}>
                      {room.occupied_beds}/{room.bed_count}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={room.active}
                      onCheckedChange={() => toggleRoomStatus(room.id)}
                    />
                    <span className="text-xs">{room.active ? 'Active' : 'Inactive'}</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditRoom(room)}
                      className="h-7 px-2"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteRoom(room.id)}
                      className="h-7 px-2 text-red-600 hover:text-red-700"
                      disabled={room.occupied_beds > 0}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bed className="h-5 w-5" />
            Room Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{rooms.length}</p>
              <p className="text-sm text-gray-600">Total Rooms</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {rooms.filter(r => r.active).length}
              </p>
              <p className="text-sm text-gray-600">Active Rooms</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {rooms.reduce((sum, r) => sum + r.bed_count, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Beds</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {rooms.reduce((sum, r) => sum + r.occupied_beds, 0)}
              </p>
              <p className="text-sm text-gray-600">Occupied Beds</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
