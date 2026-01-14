import { useState, useEffect } from 'react';
import { FileText, Upload, Trash2, Search, FolderOpen, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from '../../constants';

export default function FileExplorer() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/materials/list');
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      } else {
        setMaterials([]);
      }
    } catch (err) {
      console.error('Error loading materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/materials/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success(`Successfully uploaded ${files.length} file(s)!`);
        loadMaterials();
      } else {
        const error = await response.json();
        toast.error(`Upload failed: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (filePath) => {
    const confirmed = await new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <p className="font-semibold">Delete "{filePath}"?</p>
            <p className="text-sm text-gray-600">This will remove it from the materials folder.</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ),
        { duration: Infinity }
      );
    });

    if (!confirmed) return;

    const loadingToast = toast.loading('Deleting file...');
    
    try {
      const response = await fetch('/api/materials/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
      });

      if (response.ok) {
        toast.dismiss(loadingToast);
        toast.success('File deleted successfully!');
        loadMaterials();
      } else {
        const error = await response.json();
        toast.dismiss(loadingToast);
        toast.error(`Delete failed: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.dismiss(loadingToast);
      toast.error('Delete failed: ' + err.message);
    }
  };

  const filteredMaterials = materials.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pane flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="pane__title flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          File Explorer
        </h2>
        <label className="btn btn--small btn--primary cursor-pointer">
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload'}
          <input
            type="file"
            multiple
            accept=".pdf,.txt,.md,.docx,.doc"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
            <p className="text-sm text-text-secondary">Loading files...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-text-secondary mb-4" />
            <p className="text-sm text-text-secondary text-center">
              {searchTerm ? 'No files found matching your search.' : 'No files found. Upload files to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMaterials.map((material, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">{material.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{material.path}</div>
                    {material.size && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {(material.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(material.path)}
                  className="btn btn--small flex items-center gap-1 text-red-600 hover:text-red-700"
                  title="Delete file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
