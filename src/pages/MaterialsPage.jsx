import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Trash2, FileText, Search, FolderOpen } from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from '../constants';

export default function MaterialsPage() {
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
      // List all materials from data/Mentoring Materials folder
      const response = await fetch('/api/materials/list');
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      } else {
        // Fallback: show message about folder structure
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
      e.target.value = ''; // Reset input
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to App
      </Link>

      <div className="bg-surface rounded-xl shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <FolderOpen className="w-8 h-8" />
              Materials Library
            </h1>
            <p className="text-text-secondary">
              Manage your coaching materials. Files are automatically uploaded to OpenAI Assistant
              and cached for cost-efficient access.
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload New Materials
          </h2>
          <div className="flex items-center gap-4">
            <label className="btn btn--primary cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Choose Files'}
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.md,.docx,.doc"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <span className="text-sm text-text-secondary">
              Supported: PDF, TXT, MD, DOCX (max 50MB per file)
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            Files will be saved to <code className="bg-gray-100 px-1 rounded">data/Mentoring Materials/</code> and
            automatically synced to OpenAI Assistant.
          </p>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search materials..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Materials List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-text-secondary">Loading materials...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-text-secondary mb-4" />
            <p className="text-text-secondary mb-2">
              {searchTerm ? 'No materials found matching your search.' : 'No materials found.'}
            </p>
            {!searchTerm && (
              <p className="text-sm text-text-secondary">
                Upload files above or add them directly to{' '}
                <code className="bg-gray-100 px-1 rounded">data/Mentoring Materials/</code> folder.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMaterials.map((material, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-text-secondary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{material.name}</div>
                    <div className="text-xs text-text-secondary truncate">{material.path}</div>
                    {material.size && (
                      <div className="text-xs text-text-secondary">
                        {(material.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(material.path)}
                  className="btn btn--small btn--danger flex items-center gap-1"
                  title="Delete file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold mb-2">💡 How Materials Work</h3>
          <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
            <li>
              Materials are stored in <code>data/Mentoring Materials/</code> folder
            </li>
            <li>Files are automatically uploaded to OpenAI Assistant (one-time)</li>
            <li>Materials are embedded in a vector store for efficient search</li>
            <li>Only relevant parts are retrieved during analysis (cost-efficient)</li>
            <li>Materials are auto-selected based on role and coaching type</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
