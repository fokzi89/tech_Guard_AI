'use client'

import { useState } from 'react'
import { Button } from '@/app/components/shared/Button'
import { Input } from '@/app/components/shared/Input'
import { Modal } from '@/app/components/shared/Modal'
import { FileUpload } from '@/app/components/shared/FileUpload'

export default function ComponentTestPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [inputError, setInputError] = useState('')
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])

    const handleButtonClick = () => {
        setIsLoading(true)
        setTimeout(() => setIsLoading(false), 2000)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
        if (e.target.value.length < 3) {
            setInputError('Must be at least 3 characters')
        } else {
            setInputError('')
        }
    }

    const handleFileSelect = (files: File[]) => {
        setSelectedFiles(files)
        console.log('Selected files:', files)
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold text-gray-900">Component Testing Page</h1>

                {/* Button Tests */}
                <section className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Button Component</h2>
                    <div className="flex flex-wrap gap-4">
                        <Button variant="default">Default</Button>
                        <Button variant="destructive">Destructive</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="link">Link</Button>
                        <Button size="sm">Small</Button>
                        <Button size="lg">Large</Button>
                        <Button isLoading={isLoading} onClick={handleButtonClick}>
                            {isLoading ? 'Loading...' : 'Click to Load'}
                        </Button>
                        <Button disabled>Disabled</Button>
                    </div>
                </section>

                {/* Input Tests */}
                <section className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Input Component</h2>
                    <div className="space-y-4 max-w-md">
                        <Input
                            label="Basic Input"
                            placeholder="Enter text..."
                            helperText="This is helper text"
                        />
                        <Input
                            label="Required Input"
                            placeholder="Required field"
                            required
                        />
                        <Input
                            label="Input with Validation"
                            placeholder="Type at least 3 characters"
                            value={inputValue}
                            onChange={handleInputChange}
                            error={inputError}
                        />
                        <Input
                            label="Disabled Input"
                            placeholder="Disabled"
                            disabled
                            value="Cannot edit"
                        />
                    </div>
                </section>

                {/* Modal Test */}
                <section className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Modal Component</h2>
                    <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>

                    <Modal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        title="Test Modal"
                        description="This is a test modal with various sizes"
                        size="md"
                    >
                        <div className="space-y-4">
                            <p>This is the modal content. You can put anything here.</p>
                            <div className="flex gap-2">
                                <Button onClick={() => setIsModalOpen(false)}>Close</Button>
                                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Modal>
                </section>

                {/* FileUpload Test */}
                <section className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">FileUpload Component</h2>
                    <FileUpload
                        accept=".pdf,.doc,.docx"
                        multiple
                        maxSize={10 * 1024 * 1024} // 10MB
                        onFileSelect={handleFileSelect}
                        label="Upload Documents"
                        helperText="PDF, DOC, or DOCX files only"
                    />
                    {selectedFiles.length > 0 && (
                        <div className="mt-4">
                            <h3 className="font-semibold">Selected Files:</h3>
                            <ul className="list-disc list-inside">
                                {selectedFiles.map((file, index) => (
                                    <li key={index}>
                                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            </div>
        </div>
    )
}
