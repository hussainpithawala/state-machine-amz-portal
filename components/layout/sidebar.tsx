'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    LayoutDashboard,
    GitBranch,
    History,
    Settings,
    Database,
    Plus,
    Zap,
    Link as LinkIcon,
    Wrench,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
    name: string;
    href?: string;
    icon: React.ElementType;
    children?: NavItem[];
}

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'State Machines', href: '/dashboard/state-machines', icon: GitBranch },
    { name: 'Executions', href: '/dashboard/executions', icon: History },
    { name: 'Linked Executions', href: '/dashboard/linked-executions', icon: LinkIcon },
    {
        name: 'Tools',
        icon: Wrench,
        children: [
            { name: 'SQL Executor', href: '/dashboard/tools/sql', icon: Database },
        ]
    },
    { name: 'Create State Machine', href: '/dashboard/state-machines/new', icon: Plus }
];

function NavItemComponent({ item, pathname }: { item: NavItem; pathname: string | null }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = item.children && item.children.length > 0;
    
    const isActive = item.href ? pathname?.startsWith(item.href) : false;
    const isChildActive = item.children?.some(child => pathname?.startsWith(child.href || ''));

    if (hasChildren) {
        return (
            <div className="space-y-1">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        'flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                        isChildActive || isExpanded
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                >
                    <item.icon className={cn(
                        'mr-3 h-5 w-5',
                        isChildActive || isExpanded ? 'text-blue-600' : 'text-gray-400'
                    )} />
                    <span className="flex-1 text-left">{item.name}</span>
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                </button>
                {isExpanded && (
                    <div className="ml-9 space-y-1">
                        {item.children!.map((child) => (
                            <Link
                                key={child.name}
                                href={child.href!}
                                className={cn(
                                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                    pathname?.startsWith(child.href!)
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                )}
                            >
                                <child.icon className={cn(
                                    'mr-3 h-4 w-4',
                                    pathname?.startsWith(child.href!) ? 'text-blue-600' : 'text-gray-400'
                                )} />
                                {child.name}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Link
            href={item.href!}
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
            )} />
            {item.name}
        </Link>
    );
}

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="flex h-16 items-center px-6 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                    <Zap className="h-6 w-6 text-blue-600" />
                    <span className="font-semibold text-xl text-gray-900">StateMachine</span>
                </div>
            </div>

            <nav className="flex-1 px-3 py-4 overflow-y-auto">
                <div className="space-y-1">
                    {navigation.map((item) => (
                        <NavItemComponent key={item.name} item={item} pathname={pathname} />
                    ))}
                </div>
            </nav>
        </div>
    );
}
