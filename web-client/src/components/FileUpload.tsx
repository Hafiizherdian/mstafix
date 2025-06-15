import { useState } from 'react'
import { HiOutlineDocumentText, HiOutlineX, HiOutlineExclamation, HiOutlineCheck } from 'react-icons/hi'

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
}

export default function FileUpload({ onFileSelect, accept = '.txt,.pdf,.doc,.docx', disabled = false }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidFile, setIsValidFile] = useState(false)

  const validateFile = (file: File): boolean => {
    // Reset validation state
    setValidationError(null);
    setIsValidFile(false);
    
    // Check file type
    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidType = allowedTypes.includes(file.type) || ['txt', 'pdf', 'doc', 'docx'].includes(fileExtension || '');
    
    if (!isValidType) {
      setValidationError('Format file tidak didukung. Gunakan TXT, PDF, DOC, atau DOCX.');
      return false;
    }
    
    // Check file size (8MB max)
    if (file.size > 8 * 1024 * 1024) {
      setValidationError('Ukuran file terlalu besar. Maksimal 8MB.');
      return false;
    }
    
    // File is valid
    setIsValidFile(true);
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      } else {
        // If validation failed, don't set the file
        setSelectedFile(null);
        onFileSelect(null);
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      } else {
        // If validation failed, don't set the file
        setSelectedFile(null);
        onFileSelect(null);
        // Clear input value to allow selecting the same file again
        e.target.value = '';
      }
    }
  }

  const removeFile = () => {
    if (disabled) return
    setSelectedFile(null)
    setValidationError(null)
    setIsValidFile(false)
    onFileSelect(null)
  }

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${validationError 
            ? 'border-red-500 bg-red-500/10' 
            : isValidFile 
              ? 'border-green-500 bg-green-500/10'
              : dragActive 
                ? 'border-cyan-500 bg-cyan-500/10' 
                : disabled
                  ? 'border-zinc-600 bg-zinc-800/50 cursor-not-allowed'
                  : 'border-zinc-700 hover:border-cyan-500/50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className={`absolute inset-0 w-full h-full opacity-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        />
        
        <div className="text-center">
          {selectedFile ? (
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                {isValidFile ? (
                  <HiOutlineCheck className="w-5 h-5 text-green-500" />
                ) : (
                  <HiOutlineExclamation className="w-5 h-5 text-red-500" />
                )}
                <span className={`${isValidFile ? 'text-white' : 'text-red-400'} truncate max-w-xs`}>
                  {selectedFile.name}
                </span>
                <button 
                  onClick={removeFile}
                  className={`p-1 ${disabled ? 'hidden' : 'hover:bg-zinc-700 rounded'}`}
                  type="button"
                >
                  <HiOutlineX className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
              
              {!validationError && isValidFile && (
                <span className="text-xs text-green-500 flex items-center">
                  <HiOutlineCheck className="w-3 h-3 mr-1" />
                  File siap digunakan
                </span>
              )}
              
              {validationError && (
                <span className="text-xs text-red-500 flex items-center">
                  <HiOutlineExclamation className="w-3 h-3 mr-1" />
                  {validationError}
                </span>
              )}
              
              {!validationError && (
                <span className="text-xs text-zinc-500 mt-1">
                  {Math.round(selectedFile.size / 1024)} KB
                </span>
              )}
            </div>
          ) : (
            <>
              <HiOutlineDocumentText className={`mx-auto h-8 w-8 ${disabled ? 'text-zinc-600' : 'text-zinc-400'}`} />
              <p className={`mt-2 text-sm ${disabled ? 'text-zinc-600' : 'text-zinc-400'}`}>
                {disabled ? 'Upload disabled' : <>Drag & drop file atau <span className="text-cyan-500">browse</span></>}
              </p>
              {!disabled && (
                <p className="mt-1 text-xs text-zinc-500">
                  Mendukung: TXT, PDF, DOC, DOCX (Maks. 10MB)
                </p>
              )}
            </>
          )}
        </div>
      </div>
      
      {validationError && !selectedFile && (
        <div className="mt-2 text-sm text-red-500 flex items-center">
          <HiOutlineExclamation className="w-4 h-4 mr-1 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  )
}
