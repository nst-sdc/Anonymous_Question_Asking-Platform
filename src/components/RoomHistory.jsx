import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Users, Hash, Calendar, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRoom } from '../contexts/RoomContext';

const RoomHistory = ({ onBack, onRejoinRoom }) => {
  const { user } = useAuth();
  const { joinRoom } = useRoom();
  const [historyRooms, setHistoryRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const loadRoomHistory = async () => {
      try {
        setLoading(true);
        
        // Get all rooms the user has joined
        const { data: roomMembers, error: membersError } = await supabase
          .from('room_members')
          .select(`
            joined_at,
            is_active,
            rooms (
              id,
              name,
              code,
              created_by,
              is_active
            )
          `)
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false });

        if (membersError) throw membersError;

        if (roomMembers) {
          // Get member counts for each room
          const roomsWithCounts = await Promise.all(
            roomMembers.map(async (member) => {
              const { data: memberCount } = await supabase
                .from('room_members')
                .select('id', { count: 'exact' })
                .eq('room_id', member.rooms.id)
                .eq('is_active', true);

              return {
                id: member.rooms.id,
                name: member.rooms.name,
                code: member.rooms.code,
                created_by: member.rooms.created_by,
                joined_at: member.joined_at,
                is_active: member.rooms.is_active, // use room's is_active, not member's
                member_count: memberCount?.length || 0
              };
            })
          );

          setHistoryRooms(roomsWithCounts);
        }
      } catch (err) {
        console.error('Error loading room history:', err);
        setError(err.message || 'Failed to load room history');
      } finally {
        setLoading(false);
      }
    };

    loadRoomHistory();
  }, [user]);

  const handleRejoin = async (code) => {
    try {
      const room = await joinRoom(code);
      onRejoinRoom(code);
    } catch (err) {
      setError(err.message || 'Failed to rejoin room');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (isActive, memberCount) => {
    if (isActive === false) return 'text-gray-500 bg-gray-100 dark:bg-gray-800/30';
    if (!isActive) return 'text-red-500 bg-red-50 dark:bg-red-900/30';
    if (memberCount > 0) return 'text-green-500 bg-green-50 dark:bg-green-900/30';
    return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30';
  };

  const getStatusText = (isActive, memberCount) => {
    if (isActive === false) return 'Ended';
    if (!isActive) return 'Left';
    if (memberCount > 0) return 'Active';
    return 'Empty';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading room history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to home</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Room History</h1>
                <p className="text-slate-600 dark:text-slate-300">
                  All the rooms you've joined ({historyRooms.length} total)
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-700">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {historyRooms.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">
                  No rooms yet
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Join or create your first room to see it here
                </p>
              </div>
            ) : (
              historyRooms.map((room) => (
                <div key={room.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Hash className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                            {room.name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(room.is_active, room.member_count)}`}>
                            {getStatusText(room.is_active, room.member_count)}
                          </span>
                          {room.created_by === user?.id && (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">
                              Organizer
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-300">
                          <div className="flex items-center space-x-1">
                            <Hash className="w-4 h-4" />
                            <span className="font-mono">{room.code}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{room.member_count} member{room.member_count !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Joined {formatDate(room.joined_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {room.is_active === false ? (
                        <button
                          disabled
                          className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800/30 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed opacity-60"
                          title="This room has ended and cannot be rejoined."
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Rejoin</span>
                        </button>
                      ) : room.is_active && room.member_count > 0 && (
                        <button
                          onClick={() => handleRejoin(room.code)}
                          className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-medium"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Rejoin</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomHistory;