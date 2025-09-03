
import React from 'react';
import { GUIDES_CONTENT } from '../constants';
import { GuidesIcon } from './icons/GuidesIcon';

const GuidesView: React.FC = () => {
    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <GuidesIcon className="w-8 h-8 text-blue-400"/>
                <h2 className="text-3xl font-bold text-white">Guides</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {GUIDES_CONTENT.map(guide => (
                    <div key={guide.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors duration-300">
                        <h3 className="text-xl font-semibold text-white mb-2">{guide.title}</h3>
                        <p className="text-gray-400">{guide.summary}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GuidesView;
