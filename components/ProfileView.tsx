
import React from 'react';
import { SaveIcon } from './icons/SaveIcon';

const ProfileView: React.FC = () => {
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would save to a backend.
        // For now, we can just show an alert.
        alert("Profile settings saved! (This is a mock-up)");
    };

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">User Profile</h2>
            <form onSubmit={handleSave} className="bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-lg space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                    <input 
                        type="text" 
                        defaultValue="TradingPro123" 
                        className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                    <input 
                        type="email" 
                        defaultValue="user@example.com" 
                        className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Theme</label>
                    <select className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500">
                        <option>Dark Mode</option>
                        <option disabled>Light Mode (Coming Soon)</option>
                    </select>
                </div>
                 <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        className="flex items-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 hover:scale-105 shadow-lg"
                        >
                        <SaveIcon className="w-5 h-5 mr-2" />
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileView;
