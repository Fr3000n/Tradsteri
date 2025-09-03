
import React from 'react';
import { FAQ_CONTENT } from '../constants';
import { FaqIcon } from './icons/FaqIcon';

const FaqView: React.FC = () => {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
             <div className="flex items-center gap-3 mb-6">
                <FaqIcon className="w-8 h-8 text-blue-400"/>
                <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-4">
                {FAQ_CONTENT.map(item => (
                    <details key={item.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 group" name="faq">
                        <summary className="font-semibold text-lg text-white cursor-pointer list-none flex justify-between items-center">
                            {item.question}
                             <span className="text-blue-400 transform transition-transform duration-300 group-open:rotate-180">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            </span>
                        </summary>
                        <p className="text-gray-400 mt-3 pt-3 border-t border-gray-700">{item.answer}</p>
                    </details>
                ))}
            </div>
        </div>
    );
};

export default FaqView;
