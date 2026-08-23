import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Send, 
  ListChecks, 
  BookOpen, 
  Trash2, 
  Loader2, 
  File, 
  Bot,
  User,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlignLeft,
  Search,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { DocumentItem, AccentColorType } from '../types';

interface DocumentAnalyzerViewProps {
  documents: DocumentItem[];
  onAddDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
  onUpdateDocumentSummary: (id: string, summary: string) => void;
  onAddQA: (id: string, qa: { question: string; answer: string }) => void;
  accentColor: AccentColorType;
}

export const DocumentAnalyzerView: React.FC<DocumentAnalyzerViewProps> = ({
  documents,
  onAddDocument,
  onDeleteDocument,
  onUpdateDocumentSummary,
  onAddQA,
  accentColor,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    documents.length > 0 ? documents[0].id : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnsweringQA, setIsAnsweringQA] = useState(false);
  const [qaInput, setQaInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showRawTextPreview, setShowRawTextPreview] = useState(true);
  const [previewFilter, setPreviewFilter] = useState('');
  const [copiedText, setCopiedText] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeDoc = documents.find((d) => d.id === selectedDocId) || documents[0] || null;

  const processFile = async (file: File) => {
    setIsUploading(true);

    try {
      let textContent = '';
      let base64Data: string | undefined = undefined;

      if (
        file.type.includes('text') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.csv')
      ) {
        textContent = await file.text();
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < buffer.byteLength; i++) {
          binary += String.fromCharCode(buffer[i]);
        }
        base64Data = btoa(binary);
        textContent = `[Fichier importé : ${file.name}, taille : ${(file.size / 1024).toFixed(1)} Ko, type : ${file.type || 'binaire'}]\n\nContenu binaire indexé prêt pour l'analyse multimodale avec Arthur IA.`;
      }

      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        textContent,
        base64Data,
        mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain'),
        uploadedAt: new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        qas: [],
      };

      onAddDocument(newDoc);
      setSelectedDocId(newDoc.id);

      triggerAnalysis(newDoc, 'summary');
    } catch (err: any) {
      console.error('File load error:', err);
      alert('Impossible de lire ce document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerAnalysis = async (doc: DocumentItem, task: 'summary' | 'extract') => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: doc.name,
          textContent: doc.textContent,
          fileData: doc.base64Data,
          mimeType: doc.mimeType,
          task,
        }),
      });

      if (!res.ok) throw new Error('Échec de l’analyse');

      const data = await res.json();
      onUpdateDocumentSummary(doc.id, data.analysis);
    } catch (err: any) {
      console.error('Analysis error:', err);
      alert('Erreur lors de l’analyse du document.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaInput.trim() || !activeDoc || isAnsweringQA) return;

    const question = qaInput.trim();
    setQaInput('');
    setIsAnsweringQA(true);

    try {
      const res = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: activeDoc.name,
          textContent: activeDoc.textContent,
          fileData: activeDoc.base64Data,
          mimeType: activeDoc.mimeType,
          task: 'qa',
          question,
        }),
      });

      if (!res.ok) throw new Error('Échec de la réponse');

      const data = await res.json();
      onAddQA(activeDoc.id, {
        question,
        answer: data.analysis || 'Pas de réponse disponible.',
      });
    } catch (err: any) {
      console.error('QA Error:', err);
      alert('Erreur lors de la réponse à la question.');
    } finally {
      setIsAnsweringQA(false);
    }
  };

  const handleCopyRawText = () => {
    if (!activeDoc) return;
    navigator.clipboard.writeText(activeDoc.textContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const getAccentBtn = () => {
    switch (accentColor) {
      case 'emerald': return 'bg-emerald-600 hover:bg-emerald-500 text-white';
      case 'amber': return 'bg-amber-600 hover:bg-amber-500 text-white';
      case 'cyan': return 'bg-cyan-600 hover:bg-cyan-500 text-white';
      default: return 'bg-violet-600 hover:bg-violet-500 text-white';
    }
  };

  const filteredRawText = activeDoc
    ? previewFilter
      ? activeDoc.textContent
          .split('\n')
          .filter((line) => line.toLowerCase().includes(previewFilter.toLowerCase()))
          .join('\n')
      : activeDoc.textContent
    : '';

  const wordCount = activeDoc ? activeDoc.textContent.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = activeDoc ? activeDoc.textContent.length : 0;
  const lineCount = activeDoc ? activeDoc.textContent.split('\n').length : 0;

  return (
    <div id="document-analyzer-view" className="flex-1 overflow-y-auto p-3 sm:p-8 bg-[#070b12] space-y-6 sm:space-y-8 pb-28 md:pb-8">
      {/* Header Context */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-2"
      >
        <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Compréhension & Analyse Documentaire</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Analysez et interrogez vos documents avec Arthur IA
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Glissez vos fichiers (PDF, TXT, DOCX, CSV, Markdown) pour générer des synthèses exécutives, visualiser le texte brut extrait et poser des questions ciblées.
        </p>
      </motion.div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Drag & Drop Zone + Uploaded Documents List */}
        <div className="space-y-4 sm:space-y-6">
          {/* Drag & Drop Upload Card */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-violet-500 bg-violet-950/30'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 backdrop-blur-xl'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              accept=".pdf,.txt,.md,.docx,.csv,.json"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center mx-auto mb-3 border border-violet-500/30 shadow-lg shadow-violet-950/40">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>
            <h4 className="text-sm font-semibold text-white">
              {isUploading ? 'Chargement en cours...' : 'Glissez un document ici'}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              ou cliquez pour parcourir vos fichiers
            </p>
            <div className="mt-3 text-[11px] text-slate-500 font-mono">
              PDF, TXT, DOCX, MD, CSV, JSON
            </div>
          </div>

          {/* Document Library List */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-3 backdrop-blur-xl shadow-xl">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
              <span>Documents importés ({documents.length})</span>
            </h4>

            {documents.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 text-center">
                Aucun document chargé.
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const isSelected = activeDoc?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between group ${
                        isSelected
                          ? 'bg-violet-600/20 border-violet-500 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <File className="w-4 h-4 shrink-0 text-violet-400" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate">{doc.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {(doc.size / 1024).toFixed(0)} Ko • {doc.uploadedAt}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDocument(doc.id);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Document Analysis, Preview & Q&A */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {activeDoc ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Document Overview Header */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-xl shadow-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/30">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {activeDoc.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {(activeDoc.size / 1024).toFixed(1)} Ko • {activeDoc.uploadedAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => triggerAnalysis(activeDoc, 'summary')}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
                  >
                    {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-violet-400" />}
                    <span>Synthèse</span>
                  </button>
                  <button
                    onClick={() => triggerAnalysis(activeDoc, 'extract')}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
                  >
                    <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Entités</span>
                  </button>
                </div>
              </div>

              {/* 1. Raw Text Extracted Preview Section */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-xl shadow-xl">
                <button
                  onClick={() => setShowRawTextPreview(!showRawTextPreview)}
                  className="w-full p-4 flex items-center justify-between text-left border-b border-slate-800/80 hover:bg-slate-850/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlignLeft className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                      Aperçu du texte extrait ({charCount} caractères • {wordCount} mots)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="hidden sm:inline text-[11px] font-mono text-slate-500">
                      {lineCount} lignes
                    </span>
                    {showRawTextPreview ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {showRawTextPreview && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 space-y-3 bg-slate-950/60"
                    >
                      {/* Search & Copy Bar */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={previewFilter}
                            onChange={(e) => setPreviewFilter(e.target.value)}
                            placeholder="Rechercher dans le texte..."
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <button
                          onClick={handleCopyRawText}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-750 text-xs text-slate-300 transition-colors shrink-0"
                        >
                          {copiedText ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{copiedText ? 'Copié' : 'Copier texte'}</span>
                        </button>
                      </div>

                      {/* Raw Text Box */}
                      <div className="rounded-xl bg-black/80 border border-slate-800/80 p-3.5 font-mono text-xs text-slate-300 max-h-56 overflow-y-auto leading-relaxed whitespace-pre-wrap select-text">
                        {filteredRawText || <span className="text-slate-600 italic">Aucune correspondance trouvée.</span>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. Automatic Analysis / Summary Box */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-6 space-y-4 shadow-xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Synthèse IA du Document</span>
                  </div>
                </div>

                {isAnalyzing ? (
                  <div className="py-10 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
                    <p className="text-sm font-medium text-slate-300">
                      Analyse multimodale par Arthur IA...
                    </p>
                  </div>
                ) : activeDoc.summary ? (
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed break-words">
                    <ReactMarkdown>{activeDoc.summary}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-500 space-y-2">
                    <p className="text-sm">Cliquez sur « Synthèse » pour analyser ce document.</p>
                  </div>
                )}
              </motion.div>

              {/* 3. Interactive Q&A Over Document */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-6 space-y-4 shadow-xl backdrop-blur-xl">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-3">
                  <FileText className="w-4 h-4" />
                  <span>Interroger ce Document</span>
                </div>

                {/* Q&A Thread */}
                {activeDoc.qas && activeDoc.qas.length > 0 && (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {activeDoc.qas.map((qa, index) => (
                      <div key={index} className="space-y-2 text-xs">
                        <div className="flex items-start gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-slate-200">
                          <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span className="font-semibold">{qa.question}</span>
                        </div>
                        <div className="flex items-start gap-2 bg-violet-950/30 p-3 rounded-xl border border-violet-900/40 text-slate-300">
                          <Bot className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                          <div className="prose prose-invert prose-xs max-w-none">
                            <ReactMarkdown>{qa.answer}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Q&A Input Form */}
                <form onSubmit={handleAskQuestion} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={qaInput}
                    onChange={(e) => setQaInput(e.target.value)}
                    placeholder={`Posez une question sur "${activeDoc.name}"...`}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 min-h-[44px]"
                  />
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.95 }}
                    disabled={!qaInput.trim() || isAnsweringQA}
                    className={`px-4 sm:px-5 py-3 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 shadow-md min-h-[44px] ${getAccentBtn()}`}
                  >
                    {isAnsweringQA ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Poser</span>
                      </>
                    )}
                  </motion.button>
                </form>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 rounded-2xl bg-slate-900/40 border border-slate-800 p-6 text-slate-500 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-300">Sélectionnez un document</h3>
              <p className="text-xs text-slate-500">
                Chargez un fichier pour afficher son aperçu et lancer la synthèse automatique.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
