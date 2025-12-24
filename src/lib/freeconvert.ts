// FreeConvert API Service
// Documentation: https://www.freeconvert.com/api/v1/

const API_BASE_URL = 'https://api.freeconvert.com/v1'
const API_KEY = process.env.FREECONVERT_API_KEY!

interface FreeConvertTask {
    id: string
    operation: string
    status: 'processing' | 'completed' | 'failed' | 'error'
    message?: string
    code?: string
    percent?: number
    result?: {
        files?: Array<{
            url: string
            filename: string
            size?: number
        }>
        form?: {
            url: string
            parameters: Record<string, string>
        }
        errorCode?: string
        msg?: string
    }
}

class FreeConvertService {
    private apiKey: string

    constructor(apiKey: string) {
        this.apiKey = apiKey
    }

    private getHeaders() {
        return {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    }

    /**
     * Step 1: Create an import/upload task
     * Returns upload form URL and parameters
     */
    async createImportTask(): Promise<FreeConvertTask> {
        const response = await fetch(`${API_BASE_URL}/process/import/upload`, {
            method: 'POST',
            headers: this.getHeaders()
        })

        if (!response.ok) {
            throw new Error(`Import task failed: ${response.statusText}`)
        }

        return await response.json()
    }

    /**
     * Step 2: Upload file to the form URL
     */
    async uploadFile(uploadTask: FreeConvertTask, file: File): Promise<void> {
        if (!uploadTask.result?.form) {
            throw new Error('No upload form in task')
        }

        const formData = new FormData()
        
        // Add form parameters
        Object.entries(uploadTask.result.form.parameters).forEach(([key, value]) => {
            formData.append(key, value)
        })
        
        // Add file
        formData.append('file', file)

        const response = await fetch(uploadTask.result.form.url, {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            throw new Error(`File upload failed: ${response.statusText}`)
        }
    }

    /**
     * Step 3: Create a convert task
     */
    async createConvertTask(
        importTaskId: string,
        inputFormat: string,
        outputFormat: string,
        options?: Record<string, any>
    ): Promise<FreeConvertTask> {
        const response = await fetch(`${API_BASE_URL}/process/convert`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                input: importTaskId,
                input_format: inputFormat,
                output_format: outputFormat,
                options: options || {}
            })
        })

        if (!response.ok) {
            throw new Error(`Convert task failed: ${response.statusText}`)
        }

        return await response.json()
    }

    /**
     * Step 3 (alternative): Create a compress task
     */
    async createCompressTask(
        importTaskId: string,
        inputFormat: string,
        options?: Record<string, any>
    ): Promise<FreeConvertTask> {
        const response = await fetch(`${API_BASE_URL}/process/compress`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                input: importTaskId,
                input_format: inputFormat,
                options: options || {}
            })
        })

        if (!response.ok) {
            throw new Error(`Compress task failed: ${response.statusText}`)
        }

        return await response.json()
    }

    /**
     * Step 4: Create an export task to get download URL
     */
    async createExportTask(processTaskId: string | string[]): Promise<FreeConvertTask> {
        const input = Array.isArray(processTaskId) ? processTaskId : [processTaskId]

        const response = await fetch(`${API_BASE_URL}/process/export/url`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                input,
                archive_multiple_files: false
            })
        })

        if (!response.ok) {
            throw new Error(`Export task failed: ${response.statusText}`)
        }

        return await response.json()
    }

    /**
     * Get task status and progress
     */
    async getTaskStatus(taskId: string): Promise<FreeConvertTask> {
        const response = await fetch(`${API_BASE_URL}/process/tasks/${taskId}`, {
            method: 'GET',
            headers: this.getHeaders()
        })

        if (!response.ok) {
            throw new Error(`Get task status failed: ${response.statusText}`)
        }

        return await response.json()
    }

    /**
     * Wait for task to complete
     */
    async waitForTask(taskId: string, maxWaitMs = 60000): Promise<FreeConvertTask> {
        const startTime = Date.now()
        const pollInterval = 2000 // Poll every 2 seconds

        while (Date.now() - startTime < maxWaitMs) {
            const task = await this.getTaskStatus(taskId)

            if (task.status === 'completed') {
                return task
            }

            if (task.status === 'failed' || task.status === 'error') {
                throw new Error(task.result?.msg || 'Task failed')
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, pollInterval))
        }

        throw new Error('Task timeout')
    }

    /**
     * High-level method: Convert a file
     */
    async convertFile(
        file: File,
        inputFormat: string,
        outputFormat: string,
        options?: Record<string, any>
    ): Promise<{ downloadUrl: string; filename: string }> {
        // Step 1: Create import task
        const importTask = await this.createImportTask()
        
        // Step 2: Upload file
        await this.uploadFile(importTask, file)
        
        // Wait for import to complete
        await this.waitForTask(importTask.id)
        
        // Step 3: Create convert task
        const convertTask = await this.createConvertTask(
            importTask.id,
            inputFormat,
            outputFormat,
            options
        )
        
        // Wait for conversion to complete
        await this.waitForTask(convertTask.id)
        
        // Step 4: Create export task
        const exportTask = await this.createExportTask(convertTask.id)
        
        // Wait for export to complete
        const completedExport = await this.waitForTask(exportTask.id)
        
        if (!completedExport.result?.files?.[0]) {
            throw new Error('No download URL in export task')
        }

        return {
            downloadUrl: completedExport.result.files[0].url,
            filename: completedExport.result.files[0].filename
        }
    }

    /**
     * High-level method: Compress a file
     */
    async compressFile(
        file: File,
        inputFormat: string,
        options?: Record<string, any>
    ): Promise<{ downloadUrl: string; filename: string }> {
        // Step 1: Create import task
        const importTask = await this.createImportTask()
        
        // Step 2: Upload file
        await this.uploadFile(importTask, file)
        
        // Wait for import to complete
        await this.waitForTask(importTask.id)
        
        // Step 3: Create compress task
        const compressTask = await this.createCompressTask(
            importTask.id,
            inputFormat,
            options
        )
        
        // Wait for compression to complete
        await this.waitForTask(compressTask.id)
        
        // Step 4: Create export task
        const exportTask = await this.createExportTask(compressTask.id)
        
        // Wait for export to complete
        const completedExport = await this.waitForTask(exportTask.id)
        
        if (!completedExport.result?.files?.[0]) {
            throw new Error('No download URL in export task')
        }

        return {
            downloadUrl: completedExport.result.files[0].url,
            filename: completedExport.result.files[0].filename
        }
    }
}

// Export singleton instance
export const freeConvertService = new FreeConvertService(API_KEY)
