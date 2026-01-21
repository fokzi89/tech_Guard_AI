'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface FileUploadProps {
    accept?: string
    multiple?: boolean
    maxSize?: number // in bytes
    onFileSelect: (files: File[]) => void
    label?: string
    helperText?: string
    error?: string
}

export function FileUpload({
    accept,
    multiple = false,
    maxSize = 10 * 1024 * 1024, // 10MB default
    onFileSelect,
    label,
    helperText,
    error,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDragIn = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragOut = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files)
        handleFiles(files)
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : []
        handleFiles(files)
    }

    const handleFiles = (files: File[]) => {
        // Filter by file size
        const validFiles = files.filter(file => file.size <= maxSize)

        if (validFiles.length < files.length) {
            console.warn(`Some files exceeded the ${maxSize / 1024 / 1024}MB size limit`)
        }

        onFileSelect(validFiles)
    }

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}

            <div
                className={cn(
                    'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
                    error && 'border-red-500'
                )}
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileInput}
                />

                <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                >
                    <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>

                <p className="mt-2 text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="mt-1 text-xs text-gray-500">
                    {accept || 'Any file type'} (max {maxSize / 1024 / 1024}MB)
                </p>
            </div>

            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-2 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    )
}
