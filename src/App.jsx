import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse resume');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = () => {
    if (!result) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "resume_parsed.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-4">
            Resume Parser AI
          </h1>
          <p className="text-slate-400 text-lg">
            Upload your resume (PDF, DOCX, Image) and get structured data instantly.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Upload className="w-6 h-6 text-blue-400" />
              Upload Resume
            </h2>

            <div className="border-2 border-dashed border-slate-600 rounded-xl p-10 text-center hover:border-blue-400 transition-colors cursor-pointer relative">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.jpg,.png,.jpeg"
              />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-slate-300" />
                </div>
                {file ? (
                  <div className="text-emerald-400 font-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {file.name}
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <span className="text-blue-400 font-semibold">Click to upload</span> or drag and drop
                    <br />
                    <span className="text-sm">PDF, DOCX, Images</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all ${!file || loading
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 shadow-lg shadow-blue-500/20'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Parsing...
                </span>
              ) : 'Extract Data'}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
          </div>

          {/* Result Section */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl overflow-hidden flex flex-col max-h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <FileText className="w-6 h-6 text-emerald-400" />
                Extracted Data
              </h2>
              {result && (
                <button
                  onClick={downloadJson}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title="Download JSON"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto bg-slate-900 rounded-xl p-4 border border-slate-700 font-mono text-sm text-blue-300 shadow-inner">
              {result ? (
                <pre>{JSON.stringify(result, null, 2)}</pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                    <code className="text-xl">{ }</code>
                  </div>
                  <p>Results will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
