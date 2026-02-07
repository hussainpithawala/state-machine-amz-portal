'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {
    LayoutDashboard,
    GitBranch,
    History,
    Settings,
    Database,
    Plus,
    Zap,
} from 'lucide-react';
import {cn} from '@/lib/utils';

const navigation = [
    {name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard},
    {name: 'State Machines', href: '/dashboard/state-machines', icon: GitBranch},
    {name: 'Executions', href: '/dashboard/executions', icon: History},
    {name: 'Create State Machine', href: '/dashboard/state-machines/new', icon: Plus}
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="flex h-16 items-center px-6 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                    <Zap className="h-6 w-6 text-blue-600"/>
                    <span className="font-semibold text-xl text-gray-900">StateMachine</span>
                </div>
            </div>

            <nav className="flex-1 px-3 py-4 overflow-y-auto">
                <div className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname?.startsWith(item.href);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                                    isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                )}
                            >
                                <item.icon className={cn(
                                    'mr-3 h-5 w-5',
                                    isActive ? 'text-blue-600' : 'text-gray-400'
                                )}/>
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
