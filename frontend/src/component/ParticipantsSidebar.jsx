import React from 'react'
import { Ban, VolumeX } from 'lucide-react'

const ParticipantsSidebar = ({participant,room, isUserSilenced}) => {
  return (
    <div className="w-72 bg-card/70 backdrop-blur-sm border-l border-border p-4 overflow-y-auto">
        <h3 className="font-bold text-text mb-4">Participants ({room.participants.length})</h3>
        <div className="space-y-2">
            {participant.map((participant) => (
            <div key={participant.id} className="flex items-center justify-between p-2 bg-bg-hover rounded-lg">
                <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">
                    {participant.role === 'teacher' ? (participant.anonymousName?.charAt(0).toUpperCase() || 'T') : 'S'}
                    </span>
                </div>
                <div>
                    <div className="font-medium text-text-secondary text-sm truncate">
                    {participant.role === 'teacher' ? participant.anonymousName : 'Anonymous Student'}
                    {participant.role === 'teacher' && ' (Teacher)'}
                    </div>
                    {participant.violations > 0 && (
                    <div className="text-xs text-yellow-500">
                        {participant.violations} violation{participant.violations > 1 ? 's' : ''}
                    </div>
                    )}
                </div>
                </div>
                
                <div className="flex items-center space-x-1">
                {participant.banned && <Ban className="w-4 h-4 text-red-500" title="Banned" />}
                {isUserSilenced(participant.id) && <VolumeX className="w-4 h-4 text-orange-500" title="Silenced" />}
                </div>
            </div>
            ))}
        </div>
    </div>
  )
}

export default ParticipantsSidebar