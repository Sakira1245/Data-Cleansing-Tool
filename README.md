# XML Data Cleansing Tool

A web application built with HTML, CSS, JavaScript, and PHP for processing XML files to clean AccountID and Content tags by removing BIN/VAT prefixes and formatting numeric values.

## Features

- **Bulk File Upload**: Upload multiple XML files via drag & drop or file browser
- **Smart XML Processing**: Automatically detects and cleans AccountID and Content tags
- **Prefix Removal**: Removes "BIN" or "VAT" prefixes from tag values
- **Number Formatting**: Formats numeric values as XXXXXXX-XXXX (dash before last 4 digits)
- **Dual Output**: Generates both cleaned XML files and compressed .xml.gz versions
- **Organized Downloads**: Downloads files in separate folders (cleaned-xml-files and compressed-xml-gz-files)
- **Progress Tracking**: Real-time processing status with error handling
- **Responsive Design**: Works on desktop and mobile devices
- **Start Over**: Reset functionality to process new files

## File Structure

```
├── index.html              # Main application page
├── styles/
│   └── main.css            # Application styling
├── js/
│   ├── main.js             # Main application logic
│   └── xmlProcessor.js     # XML processing utilities
├── process.php             # Server-side processing (optional)
└── README.md               # This file
```

## Setup Instructions

### Prerequisites

- Web server (Apache, Nginx, or simple local server)
- PHP 7.4+ (if using server-side processing)
- Modern web browser with JavaScript enabled

### Installation

1. **Clone or download** the project files to your web server directory

2. **For local development**, you can use any of these methods:

   **Option A: PHP Built-in Server**
   ```bash
   php -S localhost:8000
   ```

   **Option B: Python Simple Server**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

   **Option C: Node.js http-server**
   ```bash
   npx http-server -p 8000
   ```

3. **Open your browser** and navigate to `http://localhost:8000`

### Dependencies

The application uses CDN links for external libraries:
- **Font Awesome 6.0.0** - for icons
- **JSZip 3.10.1** - for creating zip files
- **Pako 2.1.0** - for gzip compression

No additional installation required for these dependencies.

## How It Works

### XML Processing Logic

1. **File Upload**: Users can upload multiple XML files
2. **Tag Detection**: System scans for `<AccountID>` and `<Content>` tags
3. **Prefix Check**: Identifies tags starting with "BIN" or "VAT" (case-insensitive)
4. **Content Cleaning**: 
   - Removes BIN/VAT prefix
   - Extracts numeric characters
   - Formats as XXXXXXX-XXXX (dash before last 4 digits)
5. **Preservation**: Tags without BIN/VAT prefixes remain unchanged
6. **Compression**: Creates .xml.gz versions using gzip compression
7. **Download**: Provides organized zip files for download

### Example Transformations

**Before:**
```xml
<AccountID>BIN - 0002192460103</AccountID>
<Content>VAT-0001234567890</Content>
```

**After:**
```xml
<AccountID>000219246-0103</AccountID>
<Content>000123456-7890</Content>
```

## Usage Guide

1. **Upload Files**: 
   - Drag and drop XML files onto the upload area, or
   - Click "Browse Files" to select files

2. **Start Processing**: 
   - Review selected files
   - Click "Start Processing" button

3. **Monitor Progress**: 
   - Watch real-time processing status
   - View any error messages for problematic files

4. **Download Results**: 
   - Download cleaned XML files
   - Download compressed .xml.gz files
   - Download all files in organized folders

5. **Start Over**: 
   - Click "Start Over" to reset and process new files

## Technical Details

### Client-Side Processing

The application primarily processes files client-side using JavaScript:
- **XML Parsing**: Uses DOMParser for validation
- **Pattern Matching**: Regular expressions for tag detection
- **Compression**: Pako library for gzip compression
- **File Generation**: JSZip for creating downloadable archives

### Server-Side Processing (Optional)

The `process.php` file provides server-side processing capabilities:
- **File Validation**: Server-side XML validation
- **Bulk Processing**: Handle large files server-side
- **Error Handling**: Comprehensive error reporting
- **API Endpoints**: RESTful API for processing requests

### Browser Compatibility

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Required Features**: 
  - File API
  - Drag and Drop API
  - TextEncoder/TextDecoder
  - Blob API
  - ES6+ JavaScript features

## Customization

### Styling

Modify `styles/main.css` to customize:
- Color scheme (CSS custom properties in `:root`)
- Layout and spacing
- Component appearance
- Responsive breakpoints

### Processing Logic

Modify `js/xmlProcessor.js` to customize:
- Tag patterns to process
- Cleaning logic
- Validation rules
- Output formatting

### UI Behavior

Modify `js/main.js` to customize:
- User interface interactions
- Progress tracking
- Error handling
- Download behavior

## Troubleshooting

### Common Issues

1. **Files not uploading**: Check file permissions and server configuration
2. **Processing errors**: Ensure XML files are well-formed
3. **Download issues**: Check browser's download settings
4. **Performance issues**: For large files, consider using server-side processing

### Error Messages

- **"Invalid XML format"**: File is not well-formed XML
- **"Please select only XML files"**: Non-XML files were selected
- **"Failed to compress [filename]"**: Compression error occurred
- **"Error creating zip file"**: Archive generation failed

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify your setup follows the installation instructions
3. Ensure your browser supports required features
4. Check browser console for JavaScript errors