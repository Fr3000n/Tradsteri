
import React, { useState } from 'react';
import { BotIcon } from './icons/BotIcon';
import { AnnouncementIcon } from './icons/AnnouncementIcon';
import AnnouncementsModal from './AnnouncementsModal';

const Header: React.FC = () => {
    const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);

    return (
        <>
            {isAnnouncementsOpen && <AnnouncementsModal onClose={() => setIsAnnouncementsOpen(false)} />}
            <header className="bg-gray-800 shadow-md p-4 flex items-center justify-between gap-4 border-b border-gray-700">
                <div className="flex items-center gap-4">
                    <BotIcon className="w-8 h-8 text-blue-500" />
                    <h1 className="text-2xl font-bold tracking-wider">AI Trading Bot Architect</h1>
                </div>
                <button 
                    onClick={() => setIsAnnouncementsOpen(true)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors duration-200"
                    title="Announcements"
                >
                    <AnnouncementIcon className="w-6 h-6" />
                </button>
            </header>
        </>
    );
};

export default Header;
