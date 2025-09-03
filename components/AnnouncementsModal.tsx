
import React from 'react';
import { ANNOUNCEMENTS_CONTENT } from '../constants';
import { AnnouncementIcon } from './icons/AnnouncementIcon';

interface AnnouncementsModalProps {
    onClose: () => void;
}

const AnnouncementsModal: React.FC<AnnouncementsModalProps> = ({ onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg space-y-4 border border-gray-700"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
            >
                <div className="flex items-center gap-3">
                    <AnnouncementIcon className="w-6 h-6 text-blue-400" />
                    <h2 className="text-2xl font-bold text-white">Announcements</h2>
                </div>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {ANNOUNCEMENTS_CONTENT.map(item => (
                        <div key={item.id} className="bg-gray-900 p-4 rounded-md">
                            <p className="font-semibold text-blue-400">{item.title}</p>
                            <p className="text-sm text-gray-400 mt-1">{item.summary}</p>
                            <p className="text-xs text-gray-500 text-right mt-2">{item.date}</p>
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end pt-2">
                    <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementsModal;
