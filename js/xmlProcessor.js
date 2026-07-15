// XML Processing utility functions

function cleanXmlContent(xmlContent) {
    // Function to clean individual tag content for AccountID and Content tags
    function cleanTagContent(content) {
        // Remove extra whitespace and normalize
        const trimmed = content.trim();
        
        // Pattern 1: Look for 9 digits, dash, then 4 digits (123456789-1234)
        const pattern1 = /\d{9}-\d{4}/;
        const match1 = trimmed.match(pattern1);
        
        if (match1) {
            return match1[0]; // Return the matched number pattern
        }
        
        // Pattern 2: Look for exactly 13 consecutive digits (1234567890123)
        const pattern2 = /\d{13}/;
        const match2 = trimmed.match(pattern2);
        
        if (match2) {
            return match2[0]; // Return the matched 13-digit number
        }
        
        // If no match found, return original text
        return trimmed;
    }

    // Function to clean SummaryDescription tag content
    function cleanSummaryDescription(content) {
        // Remove extra whitespace and normalize
        const trimmed = content.trim();
        
        // Only allow: slash (/), full stop (.), space ( ), less than (<), equal (=), dash (-), letters (a-z, A-Z), numbers (0-9)
        // Remove all other characters
        const allowedCharsRegex = /[^a-zA-Z0-9\s\/\.<=-]/g;
        const cleaned = trimmed.replace(allowedCharsRegex, '');
        
        // Remove excessive whitespace while preserving single spaces
        return cleaned.replace(/\s+/g, ' ').trim();
    }

    // Process AccountID tags
    let cleanedXml = xmlContent.replace(
        /<AccountID>(.*?)<\/AccountID>/gi,
        (match, content) => {
            const cleanedContent = cleanTagContent(content);
            return `<AccountID>${cleanedContent}</AccountID>`;
        }
    );

    // Process Content tags
    cleanedXml = cleanedXml.replace(
        /<Content>(.*?)<\/Content>/gi,
        (match, content) => {
            const cleanedContent = cleanTagContent(content);
            return `<Content>${cleanedContent}</Content>`;
        }
    );

    // Process SummaryDescription tags
    cleanedXml = cleanedXml.replace(
        /<SummaryDescription>(.*?)<\/SummaryDescription>/gi,
        (match, content) => {
            const cleanedContent = cleanSummaryDescription(content);
            return `<SummaryDescription>${cleanedContent}</SummaryDescription>`;
        }
    );

    return cleanedXml;
}

async function compressToGzip(content, originalFileName) {
    try {
        // Convert string to Uint8Array
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        
        // Compress using pako (gzip compression)
        const compressed = pako.gzip(data);
        
        // Create blob from compressed data
        return new Blob([compressed], { type: 'application/gzip' });
    } catch (error) {
        console.error(`Error compressing file ${originalFileName}:`, error);
        throw new Error(`Failed to compress ${originalFileName}`);
    }
}

// Utility function to validate XML structure
function validateXml(xmlContent) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlContent, 'text/xml');
        
        // Check for parsing errors
        const errorNode = doc.querySelector('parsererror');
        return !errorNode;
    } catch (error) {
        return false;
    }
}

// Function to preview what changes will be made
function previewChanges(xmlContent) {
    const changes = [];
    
    function cleanTagContent(content) {
        const trimmed = content.trim();
        
        // Pattern 1: Look for 9 digits, dash, then 4 digits (123456789-1234)
        const pattern1 = /\d{9}-\d{4}/;
        const match1 = trimmed.match(pattern1);
        
        if (match1) {
            return match1[0]; // Return the matched number pattern
        }
        
        // Pattern 2: Look for exactly 13 consecutive digits (1234567890123)
        const pattern2 = /\d{13}/;
        const match2 = trimmed.match(pattern2);
        
        if (match2) {
            return match2[0]; // Return the matched 13-digit number
        }
        
        // If no match found, return original text
        return trimmed;
    }

    function cleanSummaryDescriptionContent(content) {
        const trimmed = content.trim();
        const allowedCharsRegex = /[^a-zA-Z0-9\s\/\.<=-]/g;
        const cleaned = trimmed.replace(allowedCharsRegex, '');
        return cleaned.replace(/\s+/g, ' ').trim();
    }
    
    // Find AccountID tags that would be changed
    const accountIdRegex = /<AccountID>(.*?)<\/AccountID>/gi;
    let match;
    while ((match = accountIdRegex.exec(xmlContent)) !== null) {
        const original = match[1];
        const cleaned = cleanTagContent(original);
        if (original !== cleaned) {
            changes.push({ original, cleaned, tagType: 'AccountID' });
        }
    }
    
    // Find Content tags that would be changed
    const contentRegex = /<Content>(.*?)<\/Content>/gi;
    while ((match = contentRegex.exec(xmlContent)) !== null) {
        const original = match[1];
        const cleaned = cleanTagContent(original);
        if (original !== cleaned) {
            changes.push({ original, cleaned, tagType: 'Content' });
        }
    }
    
    // Find SummaryDescription tags that would be changed
    const summaryRegex = /<SummaryDescription>(.*?)<\/SummaryDescription>/gi;
    while ((match = summaryRegex.exec(xmlContent)) !== null) {
        const original = match[1];
        const cleaned = cleanSummaryDescriptionContent(original);
        if (original !== cleaned) {
            changes.push({ original, cleaned, tagType: 'SummaryDescription' });
        }
    }
    
    return changes;
}

// Format file size helper
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
