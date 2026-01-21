'use client'

import { cn } from '@/lib/utils'

export interface StatsCardProps {
    title: string
    value: string | number
    description?: string
    icon?: React.ReactNode
    trend?: {
        value: number
        isPositive: boolean
    }
    onClick?: () => void
    isLoading?: boolean
}

export function StatsCard({
    title,
    value,
    description,
    icon,
    trend,
    onClick,
    isLoading = false,
}: StatsCardProps) {
    return (
        <div
            className={cn(
                'bg-white rounded-lg shadow p-6 transition-all',
                onClick && 'cursor-pointer hover:shadow-lg hover:scale-105'
            )}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    {isLoading ? (
                        <div className="mt-2 h-8 w-24 bg-gray-200 animate-pulse rounded" />
                    ) : (
                        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
                    )}
                    {description && (
                        <p className="mt-1 text-sm text-gray-500">{description}</p>
                    )}
                    {trend && (
                        <div className="mt-2 flex items-center">
                            <span
                                className={cn(
                                    'text-sm font-medium',
                                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                                )}
                            >
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                            </span>
                            <span className="ml-2 text-sm text-gray-500">vs last month</span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className="ml-4 flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            {icon}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
