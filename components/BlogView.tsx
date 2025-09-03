
import React from 'react';
import { BLOG_CONTENT } from '../constants';
import { BlogIcon } from './icons/BlogIcon';

const BlogView: React.FC = () => {
    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <BlogIcon className="w-8 h-8 text-blue-400"/>
                <h2 className="text-3xl font-bold text-white">Blog</h2>
            </div>
            <div className="space-y-6">
                {BLOG_CONTENT.map(post => (
                    <div key={post.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors duration-300">
                        <h3 className="text-xl font-semibold text-white mb-2">{post.title}</h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span>By {post.author}</span>
                            <span>{post.date}</span>
                        </div>
                        <p className="text-gray-400">{post.summary}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BlogView;
