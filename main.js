// Main application logic

class XMLCleansingTool {
    constructor() {
        this.files = [];
        this.processedFiles = [];
        this.currentStep = 'upload';
        this.isProcessing = false;
        
        this.initializeElements();
        this.bindEvents();
        this.updateUI();
    }
    
    initializeElements() {
        // Step elements
        this.stepTitle = document.getElementById('step-title');
        this.stepDescription = document.getElementById('step-description');
        this.startOverBtn = document.getElementById('start-over-btn');
        
        // Upload elements
        this.uploadSection = document.getElementById('upload-section');
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.browseBtn = document.getElementById('browse-btn');
        this.selectedFiles = document.getElementById('selected-files');
        this.fileCount = document.getElementById('file-count');
        this.fileList = document.getElementById('file-list');
        this.startProcessingBtn = document.getElementById('start-processing-btn');
        
        // Processing elements
        this.processingSection = document.getElementById('processing-section');
        this.processingTitle = document.getElementById('processing-title');
        this.progressFill = document.getElementById('progress-fill');
        this.processingStats = document.getElementById('processing-stats');
        this.processingList = document.getElementById('processing-list');
        this.processingComplete = document.getElementById('processing-complete');
        this.completeMessage = document.getElementById('complete-message');
        
        // Download elements
        this.downloadSection = document.getElementById('download-section');
        this.downloadStats = document.getElementById('download-stats');
        this.downloadXmlBtn = document.getElementById('download-xml-btn');
        this.downloadGzBtn = document.getElementById('download-gz-btn');
        this.downloadAllBtn = document.getElementById('download-all-btn');
        this.downloadAllText = document.getElementById('download-all-text');
        this.summaryList = document.getElementById('summary-list');
        
        // Loading overlay
        this.loadingOverlay = document.getElementById('loading-overlay');
        this.loadingText = document.getElementById('loading-text');
    }
    
    bindEvents() {
        // Upload events
        //this.browseBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        this.uploadArea.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.startProcessingBtn.addEventListener('click', () => this.startProcessing());
        
        // Control events
        this.startOverBtn.addEventListener('click', () => this.startOver());
        
        // Download events
        this.downloadXmlBtn.addEventListener('click', () => this.downloadCleanedFiles());
        this.downloadGzBtn.addEventListener('click', () => this.downloadCompressedFiles());
        this.downloadAllBtn.addEventListener('click', () => this.downloadAllFiles());
    }
    
    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.addFiles(files);
        event.target.value = ''; // Reset input
    }
    
    handleDragOver(event) {
        event.preventDefault();
        this.uploadArea.classList.add('drag-over');
    }
    
    handleDragEnter(event) {
        event.preventDefault();
        this.uploadArea.classList.add('drag-over');
    }
    
    handleDragLeave(event) {
        event.preventDefault();
        if (!this.uploadArea.contains(event.relatedTarget)) {
            this.uploadArea.classList.remove('drag-over');
        }
    }
    
    handleDrop(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('drag-over');
        const files = Array.from(event.dataTransfer.files);
        this.addFiles(files);
    }
    
    addFiles(newFiles) {
        const xmlFiles = newFiles.filter(file => file.name.toLowerCase().endsWith('.xml'));
        
        if (xmlFiles.length !== newFiles.length) {
            alert('Please select only XML files');
        }
        
        // Add new files to existing ones
        this.files = [...this.files, ...xmlFiles];
        this.updateFileList();
        this.updateUI();
    }
    
    removeFile(index) {
        this.files.splice(index, 1);
        this.updateFileList();
        this.updateUI();
    }
    
    updateFileList() {
        this.fileList.innerHTML = '';
        
        this.files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-file-alt"></i>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button class="btn btn-danger btn-sm" onclick="app.removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            this.fileList.appendChild(fileItem);
        });
        
        this.fileCount.textContent = `Selected Files (${this.files.length})`;
        this.startProcessingBtn.textContent = `Start Processing (${this.files.length} files)`;
        this.startProcessingBtn.disabled = this.files.length === 0;
        
        this.selectedFiles.style.display = this.files.length > 0 ? 'block' : 'none';
    }
    
    startProcessing() {
        this.currentStep = 'processing';
        this.isProcessing = true;
        this.updateUI();
        this.processFiles();
    }
    
    async processFiles() {
        this.processedFiles = [];
        this.processingTitle.textContent = `Processing ${this.files.length} files...`;
        
        // Initialize processing list
        this.processingList.innerHTML = '';
        this.files.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'processing-item';
            item.innerHTML = `
                <div class="status-icon">
                    <div class="status-pending"></div>
                </div>
                <div class="processing-file-info">
                    <div class="processing-file-name">${file.name}</div>
                </div>
                <div class="processing-status-text">Waiting</div>
            `;
            this.processingList.appendChild(item);
        });
        
        let completed = 0;
        let errors = 0;
        
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            const item = this.processingList.children[i];
            
            // Update to processing
            item.querySelector('.status-icon').innerHTML = '<i class="fas fa-spinner status-processing"></i>';
            item.querySelector('.processing-status-text').textContent = 'Processing...';
            
            try {
                const xmlContent = await file.text();
                
                // Validate XML
                if (!validateXml(xmlContent)) {
                    throw new Error('Invalid XML format');
                }
                
                const cleanedXml = cleanXmlContent(xmlContent);
                const compressedData = await compressToGzip(cleanedXml, file.name);
                
                this.processedFiles.push({
                    originalName: file.name,
                    cleanedXml,
                    compressedData
                });
                
                // Update to completed
                item.querySelector('.status-icon').innerHTML = '<i class="fas fa-check-circle status-completed"></i>';
                item.querySelector('.processing-status-text').textContent = 'Done';
                completed++;
                
            } catch (error) {
                // Update to error
                item.querySelector('.status-icon').innerHTML = '<i class="fas fa-exclamation-circle status-error"></i>';
                item.querySelector('.processing-file-info').innerHTML += `<div class="processing-error">${error.message}</div>`;
                item.querySelector('.processing-status-text').textContent = 'Error';
                errors++;
            }
            
            // Update progress
            const progress = ((i + 1) / this.files.length) * 100;
            this.progressFill.style.width = `${progress}%`;
            
            const remaining = this.files.length - completed - errors;
            this.processingStats.textContent = `${completed} completed, ${errors} errors, ${remaining} remaining`;
            
            // Small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Show completion message
        setTimeout(() => {
            this.processingComplete.style.display = 'block';
            this.completeMessage.textContent = `Processing completed! ${completed} files processed successfully.${errors > 0 ? ` ${errors} files had errors.` : ''}`;
            
            // Move to download step after a short delay
            setTimeout(() => {
                this.currentStep = 'download';
                this.isProcessing = false;
                this.updateUI();
                this.updateDownloadSection();
            }, 1500);
        }, 500);
    }
    
    updateDownloadSection() {
        this.downloadStats.textContent = `${this.processedFiles.length} files processed successfully`;
        
        // Update file summary
        this.summaryList.innerHTML = '';
        this.processedFiles.forEach(file => {
            const item = document.createElement('div');
            item.className = 'summary-item';
            item.innerHTML = `
                <i class="fas fa-file-alt"></i>
                <span class="summary-name">${file.originalName}</span>
                <span class="summary-status">Processed</span>
            `;
            this.summaryList.appendChild(item);
        });
    }
    
    async downloadCleanedFiles() {
        this.showLoading('Generating cleaned XML files...');
        
        try {
            const zip = new JSZip();
            const cleanedFolder = zip.folder('cleaned-xml-files');
            
            this.processedFiles.forEach(file => {
                cleanedFolder.file(file.originalName, file.cleanedXml);
            });
            
            const content = await zip.generateAsync({ type: 'blob' });
            this.downloadBlob(content, 'cleaned-xml-files.zip');
        } catch (error) {
            console.error('Error creating zip file:', error);
            alert('Error creating zip file. Please try again.');
        } finally {
            this.hideLoading();
        }
    }
    
    async downloadCompressedFiles() {
        this.showLoading('Generating compressed files...');
        
        try {
            const zip = new JSZip();
            const compressedFolder = zip.folder('compressed-xml-gz-files');
            
            this.processedFiles.forEach(file => {
                const gzFileName = file.originalName.replace('.xml', '.xml.gz');
                compressedFolder.file(gzFileName, file.compressedData);
            });
            
            const content = await zip.generateAsync({ type: 'blob' });
            this.downloadBlob(content, 'compressed-xml-gz-files.zip');
        } catch (error) {
            console.error('Error creating zip file:', error);
            alert('Error creating zip file. Please try again.');
        } finally {
            this.hideLoading();
        }
    }
    
    async downloadAllFiles() {
        this.showLoading('Generating all files...');
        this.downloadAllText.textContent = 'Generating...';
        
        try {
            const zip = new JSZip();
            
            // Add cleaned XML files
            const cleanedFolder = zip.folder('cleaned-xml-files');
            this.processedFiles.forEach(file => {
                cleanedFolder.file(file.originalName, file.cleanedXml);
            });
            
            // Add compressed files
            const compressedFolder = zip.folder('compressed-xml-gz-files');
            this.processedFiles.forEach(file => {
                const gzFileName = file.originalName.replace('.xml', '.xml.gz');
                compressedFolder.file(gzFileName, file.compressedData);
            });
            
            const content = await zip.generateAsync({ type: 'blob' });
            this.downloadBlob(content, 'all-processed-files.zip');
        } catch (error) {
            console.error('Error creating zip file:', error);
            alert('Error creating zip file. Please try again.');
        } finally {
            this.hideLoading();
            this.downloadAllText.textContent = 'Download All Files';
        }
    }
    
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    showLoading(text) {
        this.loadingText.textContent = text;
        this.loadingOverlay.style.display = 'flex';
    }
    
    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }
    
    startOver() {
        this.files = [];
        this.processedFiles = [];
        this.currentStep = 'upload';
        this.isProcessing = false;
        this.updateFileList();
        this.updateUI();
        
        // Reset processing display
        this.processingComplete.style.display = 'none';
        this.progressFill.style.width = '0%';
        this.processingList.innerHTML = '';
    }
    
    updateUI() {
        // Hide all sections
        this.uploadSection.classList.remove('active');
        this.processingSection.classList.remove('active');
        this.downloadSection.classList.remove('active');
        
        // Update header and show appropriate section
        switch (this.currentStep) {
            case 'upload':
                this.stepTitle.textContent = 'Upload XML Files';
                this.stepDescription.textContent = 'Select multiple XML files to process';
                this.uploadSection.classList.add('active');
                this.startOverBtn.style.display = 'none';
                break;
                
            case 'processing':
                this.stepTitle.textContent = 'Processing Files';
                this.stepDescription.textContent = 'Please wait while we clean your XML files';
                this.processingSection.classList.add('active');
                this.startOverBtn.style.display = 'none';
                break;
                
            case 'download':
                this.stepTitle.textContent = 'Download Results';
                this.stepDescription.textContent = 'Your files are ready for download';
                this.downloadSection.classList.add('active');
                this.startOverBtn.style.display = 'flex';
                break;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new XMLCleansingTool();
});