"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavigationButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    href?: string
    loading?: boolean
    unstyled?: boolean
}

export function NavigationButton({
    className,
    href,
    onClick,
    children,
    loading: externalLoading,
    disabled,
    unstyled = false,
    ...props
}: NavigationButtonProps) {
    const router = useRouter()
    const [internalLoading, setInternalLoading] = React.useState(false)

    const isLoading = externalLoading || internalLoading

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isLoading || disabled) {
            e.preventDefault()
            return
        }

        if (onClick) {
            onClick(e)
        }

        if (href) {
            e.preventDefault()
            setInternalLoading(true)
            router.push(href)
        }
    }

    const baseStyles = unstyled
        ? "relative"
        : "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

    return (
        <button
            className={cn(
                baseStyles,
                isLoading && !unstyled && "cursor-wait opacity-70",
                isLoading && unstyled && "cursor-wait opacity-80",
                className
            )}
            onClick={handleClick}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <span className={cn(
                    "flex items-center justify-center",
                    unstyled ? "absolute inset-0 bg-black/10 dark:bg-white/10 backdrop-blur-[1px] rounded-inherit" : "mr-2"
                )}>
                    <svg
                        className={cn("animate-spin", unstyled ? "h-8 w-8 text-white" : "h-4 w-4")}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                </span>
            )}
            {children}
        </button>
    )
}
