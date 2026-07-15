<?php
/**
 * PHP XML Processing Backend
 * This file provides server-side XML processing capabilities
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

/**
 * Clean XML content by processing AccountID, Content, and SummaryDescription tags
 */
function cleanXmlContent($xmlContent) {
    // Function to clean individual tag content for AccountID and Content tags
    function cleanTagContent($content) {
        // Remove extra whitespace and normalize
        $trimmed = trim($content);
        
        // Check if content starts with BIN or VAT (case insensitive)
        if (preg_match('/^(BIN|VAT)\s*-?\s*/i', $trimmed, $matches)) {
            // Remove BIN/VAT prefix
            $withoutPrefix = preg_replace('/^(BIN|VAT)\s*-?\s*/i', '', $trimmed);
            
            // Extract numeric part (remove any non-numeric characters except dashes)
            $numericPart = preg_replace('/[^0-9-]/', '', $withoutPrefix);
            
            // If we have a numeric string, format it
            if (!empty($numericPart) && strlen($numericPart) >= 4) {
                // Remove existing dashes and get pure numbers
                $pureNumbers = str_replace('-', '', $numericPart);
                
                // Format as XXXXXXX-XXXX (dash before last 4 digits)
                if (strlen($pureNumbers) >= 4) {
                    $beforeDash = substr($pureNumbers, 0, -4);
                    $afterDash = substr($pureNumbers, -4);
                    return $beforeDash . '-' . $afterDash;
                }
            }
            
            // If we can't format properly, return the cleaned numeric part
            return !empty($numericPart) ? $numericPart : $trimmed;
        }
        
        // If no BIN/VAT prefix, return original content unchanged
        return $trimmed;
    }

    // Function to clean SummaryDescription tag content
    function cleanSummaryDescription($content) {
        // Remove extra whitespace and normalize
        $trimmed = trim($content);
        
        // Only allow: slash (/), full stop (.), space ( ), less than (<), equal (=), dash (-), letters (a-z, A-Z), numbers (0-9)
        // Remove all other characters
        $cleaned = preg_replace('/[^a-zA-Z0-9\s\/\.<=-]/', '', $trimmed);
        
        // Remove excessive whitespace while preserving single spaces
        return preg_replace('/\s+/', ' ', trim($cleaned));
    }

    // Process AccountID tags
    $cleanedXml = preg_replace_callback(
        '/<AccountID>(.*?)<\/AccountID>/i',
        function($matches) {
            $cleanedContent = cleanTagContent($matches[1]);
            return '<AccountID>' . $cleanedContent . '</AccountID>';
        },
        $xmlContent
    );

    // Process Content tags
    $cleanedXml = preg_replace_callback(
        '/<Content>(.*?)<\/Content>/i',
        function($matches) {
            $cleanedContent = cleanTagContent($matches[1]);
            return '<Content>' . $cleanedContent . '</Content>';
        },
        $cleanedXml
    );

    // Process SummaryDescription tags
    $cleanedXml = preg_replace_callback(
        '/<SummaryDescription>(.*?)<\/SummaryDescription>/i',
        function($matches) {
            $cleanedContent = cleanSummaryDescription($matches[1]);
            return '<SummaryDescription>' . $cleanedContent . '</SummaryDescription>';
        },
        $cleanedXml
    );

    return $cleanedXml;
}

/**
 * Validate XML structure
 */
function validateXml($xmlContent) {
    $previousState = libxml_use_internal_errors(true);
    $xml = simplexml_load_string($xmlContent);
    $errors = libxml_get_errors();
    libxml_use_internal_errors($previousState);
    
    return $xml !== false && empty($errors);
}

/**
 * Compress content using gzip
 */
function compressToGzip($content) {
    return gzcompress($content, 9);
}

/**
 * Format file size
 */
function formatFileSize($bytes) {
    if ($bytes == 0) return '0 Bytes';
    $k = 1024;
    $sizes = array('Bytes', 'KB', 'MB', 'GB');
    $i = floor(log($bytes) / log($k));
    return round($bytes / pow($k, $i), 2) . ' ' . $sizes[$i];
}

/**
 * Main processing endpoint
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    switch ($action) {
        case 'process_xml':
            if (!isset($_FILES['files'])) {
                echo json_encode(['error' => 'No files uploaded']);
                exit;
            }
            
            $results = [];
            $uploadedFiles = $_FILES['files'];
            
            // Handle multiple files
            if (is_array($uploadedFiles['name'])) {
                for ($i = 0; $i < count($uploadedFiles['name']); $i++) {
                    if ($uploadedFiles['error'][$i] === UPLOAD_ERR_OK) {
                        $fileName = $uploadedFiles['name'][$i];
                        $tempFile = $uploadedFiles['tmp_name'][$i];
                        
                        // Validate file extension
                        if (!preg_match('/\.xml$/i', $fileName)) {
                            $results[] = [
                                'fileName' => $fileName,
                                'success' => false,
                                'error' => 'Invalid file type. Only XML files are allowed.'
                            ];
                            continue;
                        }
                        
                        try {
                            $xmlContent = file_get_contents($tempFile);
                            
                            // Validate XML
                            if (!validateXml($xmlContent)) {
                                $results[] = [
                                    'fileName' => $fileName,
                                    'success' => false,
                                    'error' => 'Invalid XML format'
                                ];
                                continue;
                            }
                            
                            // Clean XML content
                            $cleanedXml = cleanXmlContent($xmlContent);
                            
                            // Compress to gzip
                            $compressedData = compressToGzip($cleanedXml);
                            
                            $results[] = [
                                'fileName' => $fileName,
                                'success' => true,
                                'cleanedXml' => base64_encode($cleanedXml),
                                'compressedData' => base64_encode($compressedData),
                                'originalSize' => strlen($xmlContent),
                                'cleanedSize' => strlen($cleanedXml),
                                'compressedSize' => strlen($compressedData)
                            ];
                            
                        } catch (Exception $e) {
                            $results[] = [
                                'fileName' => $fileName,
                                'success' => false,
                                'error' => $e->getMessage()
                            ];
                        }
                    } else {
                        $results[] = [
                            'fileName' => $uploadedFiles['name'][$i],
                            'success' => false,
                            'error' => 'File upload error: ' . $uploadedFiles['error'][$i]
                        ];
                    }
                }
            }
            
            echo json_encode([
                'success' => true,
                'results' => $results
            ]);
            break;
            
        case 'preview_changes':
            $xmlContent = $_POST['xmlContent'] ?? '';
            
            if (empty($xmlContent)) {
                echo json_encode(['error' => 'No XML content provided']);
                exit;
            }
            
            $changes = [];
            
            // Find AccountID changes
            if (preg_match_all('/<AccountID>(.*?)<\/AccountID>/i', $xmlContent, $matches)) {
                foreach ($matches[1] as $content) {
                    $original = $content;
                    $cleaned = cleanTagContent($content);
                    if ($original !== $cleaned) {
                        $changes[] = [
                            'tagType' => 'AccountID',
                            'original' => $original,
                            'cleaned' => $cleaned
                        ];
                    }
                }
            }
            
            // Find Content changes
            if (preg_match_all('/<Content>(.*?)<\/Content>/i', $xmlContent, $matches)) {
                foreach ($matches[1] as $content) {
                    $original = $content;
                    $cleaned = cleanTagContent($content);
                    if ($original !== $cleaned) {
                        $changes[] = [
                            'tagType' => 'Content',
                            'original' => $original,
                            'cleaned' => $cleaned
                        ];
                    }
                }
            }

            // Find SummaryDescription changes
            if (preg_match_all('/<SummaryDescription>(.*?)<\/SummaryDescription>/i', $xmlContent, $matches)) {
                foreach ($matches[1] as $content) {
                    $original = $content;
                    $cleaned = cleanSummaryDescriptionContent($content);
                    if ($original !== $cleaned) {
                        $changes[] = [
                            'tagType' => 'SummaryDescription',
                            'original' => $original,
                            'cleaned' => $cleaned
                        ];
                    }
                }
            }
            
            echo json_encode([
                'success' => true,
                'changes' => $changes
            ]);
            break;
            
        default:
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
} else {
    echo json_encode(['error' => 'Only POST requests are allowed']);
}

/**
 * Helper function for tag content cleaning (needed for preview)
 */
function cleanTagContent($content) {
    $trimmed = trim($content);
    
    if (preg_match('/^(BIN|VAT)\s*-?\s*/i', $trimmed)) {
        $withoutPrefix = preg_replace('/^(BIN|VAT)\s*-?\s*/i', '', $trimmed);
        $numericPart = preg_replace('/[^0-9-]/', '', $withoutPrefix);
        
        if (!empty($numericPart) && strlen($numericPart) >= 4) {
            $pureNumbers = str_replace('-', '', $numericPart);
            
            if (strlen($pureNumbers) >= 4) {
                $beforeDash = substr($pureNumbers, 0, -4);
                $afterDash = substr($pureNumbers, -4);
                return $beforeDash . '-' . $afterDash;
            }
        }
        
        return !empty($numericPart) ? $numericPart : $trimmed;
    }
    
    return $trimmed;
}

/**
 * Helper function for SummaryDescription content cleaning (needed for preview)
 */
function cleanSummaryDescriptionContent($content) {
    $trimmed = trim($content);
    $cleaned = preg_replace('/[^a-zA-Z0-9\s\/\.<=-]/', '', $trimmed);
    return preg_replace('/\s+/', ' ', trim($cleaned));
}
?>