export function validateFile(file: File, allowedTypes: string[], maxSizeBytes: number) {
    if (!allowedTypes.some((type) => file.type.startsWith(type.replace('*', '')))) {
        return { valid: false, error: 'Invalid file type' };
    }
    if (file.size > maxSizeBytes) {
        return { valid: false, error: 'File size exceeds limit' };
    }
    return { valid: true };
}
