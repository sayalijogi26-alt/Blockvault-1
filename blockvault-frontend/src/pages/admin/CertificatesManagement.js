import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import apiService from '../../services/api';
import {
  Plus,
  Search,
  Eye,
  Download,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle,
  AlertTriangle,
  Copy,
  Check,
  X,
  ExternalLink,
  FileCheck,
  RotateCcw,
  FileText,
  Award,
} from 'lucide-react';

const initialCertificates = [
  {
    id: 'BV-2026-2293B257',
    certificateId: 'BV-2026-2293B257',
    studentName: 'Pranav Thawali',
    rollNumber: '101',
    course: 'BCA',
    department: 'Information Technology',
    institution: 'Government Polytechnic Amravati',
    issueDate: '2026-10-01',
    status: 'Valid',
    grade: 'First Class with Distinction',
    sha256: 'ec61a8ddd67ad100bbd2c6ec06714e4c324cd3162ec8217c137034b2e72ee44f',
    hash: 'ec61a8ddd67ad100bbd2c6ec06714e4c324cd3162ec8217c137034b2e72ee44f',
    blockNumber: 'Block #1',
    issuer: 'Government Polytechnic Amravati',
    pdfUrl: `${apiService.BACKEND_URL}/certificates/BV-2026-2293B257.pdf`,
    verificationUrl: `https://sayalijogi26-alt.github.io/Blockvault-1/#/verify/BV-2026-2293B257`,
  },
  {
    id: 'BV-2026-2B4C9988',
    certificateId: 'BV-2026-2B4C9988',
    studentName: 'Sayali Jogi',
    rollNumber: 'RN-246',
    course: 'Diploma in Computer Engineering',
    department: 'Computer Engineering',
    institution: 'Government Polytechnic Amravati',
    issueDate: '2026-10-03',
    status: 'Valid',
    grade: 'First Class with Distinction',
    sha256: '0238f57ab0e72e66f82ab11fd6b912079484b6979d966c918a247e3dacdfdba6',
    hash: '0238f57ab0e72e66f82ab11fd6b912079484b6979d966c918a247e3dacdfdba6',
    blockNumber: 'Block #2',
    issuer: 'Office of the Registrar',
    pdfUrl: `${apiService.BACKEND_URL}/certificates/BV-2026-2B4C9988.pdf`,
    verificationUrl: `https://sayalijogi26-alt.github.io/Blockvault-1/#/verify/BV-2026-2B4C9988`,
  },
  {
    id: 'BV-2026-EA31F63B',
    certificateId: 'BV-2026-EA31F63B',
    studentName: 'Aditi Deshmukh',
    rollNumber: 'RN-114',
    course: 'Diploma in Information Technology',
    department: 'Information Technology',
    institution: 'Government Polytechnic Amravati',
    issueDate: '2026-10-03',
    status: 'Valid',
    grade: 'First Class with Distinction',
    sha256: 'd72ed5bac1a7366889bf3cc0ef1359f3c00ce3223a5738b133ee1145cf7e02cb',
    hash: 'd72ed5bac1a7366889bf3cc0ef1359f3c00ce3223a5738b133ee1145cf7e02cb',
    blockNumber: 'Block #3',
    issuer: 'Office of the Registrar',
    pdfUrl: `${apiService.BACKEND_URL}/certificates/BV-2026-EA31F63B.pdf`,
    verificationUrl: `https://sayalijogi26-alt.github.io/Blockvault-1/#/verify/BV-2026-EA31F63B`,
  },
  {
    id: 'BV-2026-E4790DA9',
    certificateId: 'BV-2026-E4790DA9',
    studentName: 'Audit Test Student',
    rollNumber: 'AUD-2026',
    course: 'Diploma in Computer Engineering',
    department: 'Computer Engineering',
    institution: 'Government Polytechnic Amravati',
    issueDate: '2026-10-05',
    status: 'Invalid',
    revocationReason: 'Automated Audit Revocation',
    grade: 'First Class with Distinction',
    sha256: '3603b74dad5d4bfbfe35c3f641f0b145bbbd2f104f5762ea82e604db5cd24317',
    hash: '3603b74dad5d4bfbfe35c3f641f0b145bbbd2f104f5762ea82e604db5cd24317',
    blockNumber: 'Block #4',
    issuer: 'Office of the Registrar',
    pdfUrl: `${apiService.BACKEND_URL}/certificates/BV-2026-E4790DA9.pdf`,
    verificationUrl: `https://sayalijogi26-alt.github.io/Blockvault-1/#/verify/BV-2026-E4790DA9`,
  }
];

const statusConfig = {
  Valid: 'bg-green-100 text-green-800 border-green-200',
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Invalid: 'bg-red-100 text-red-800 border-red-200',
};

export default function CertificatesManagement() {
  const [certificates, setCertificates] = useState(initialCertificates);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals
  const [viewModalCert, setViewModalCert] = useState(null);
  const [previewMode, setPreviewMode] = useState('certificate'); // 'certificate' or 'pdf'
  const [revokeModalCert, setRevokeModalCert] = useState(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [revocationReason, setRevocationReason] = useState('Administrative Review');
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Issue Certificate Form State
  const [issueForm, setIssueForm] = useState({
    studentName: '',
    rollNumber: '',
    course: 'Diploma in Computer Engineering',
    department: 'Computer Engineering',
    institution: 'Government Polytechnic Amravati',
    issueDate: new Date().toISOString().split('T')[0],
    grade: 'First Class with Distinction',
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await apiService.getCertificates();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const sanitized = res.data.map((c) => {
          const certId = c.certificateId || c.id;
          return {
            ...c,
            id: certId,
            certificateId: certId,
            verificationUrl: `https://sayalijogi26-alt.github.io/Blockvault-1/#/verify/${certId}`,
            pdfUrl: `${apiService.BACKEND_URL}/certificates/${certId}.pdf`,
          };
        });
        setCertificates(sanitized);
      }
    } catch (err) {
      console.warn('Backend certificates fetch failed, using local store:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch =
      (cert.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cert.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cert.course || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || cert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage) || 1;
  const paginatedCertificates = filteredCertificates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ACTION 1: View Certificate (Immediately open visual certificate card)
  const handleView = (cert) => {
    setViewModalCert(cert);
    setPreviewMode('certificate');
  };

  // ACTION 2: Download Real PDF Certificate
  const handleDownload = (cert) => {
    const certId = cert.certificateId || cert.id;
    const downloadUrl = `${apiService.BACKEND_URL}/certificates/${certId}.pdf`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `Certificate_${certId}_${(cert.studentName || 'student').replace(/\s+/g, '_')}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Downloading official Certificate PDF for ${cert.studentName} (${certId})`);
  };

  // ACTION 3: Revoke or Restore Certificate
  const openRevokeModal = (cert) => {
    setRevokeModalCert(cert);
    setRevocationReason(cert.revocationReason || 'Administrative Review');
  };

  const confirmStatusChange = async () => {
    if (!revokeModalCert) return;

    const isCurrentlyInvalid = revokeModalCert.status === 'Invalid';
    const nextStatus = isCurrentlyInvalid ? 'Valid' : 'Invalid';

    try {
      if (isCurrentlyInvalid) {
        await apiService.restoreCertificate(revokeModalCert.id);
      } else {
        await apiService.revokeCertificate(revokeModalCert.id, revocationReason);
      }
    } catch (err) {
      console.warn('Error communicating revocation to backend:', err);
    }

    setCertificates((prev) =>
      prev.map((c) => {
        if (c.id === revokeModalCert.id) {
          return {
            ...c,
            status: nextStatus,
            revocationReason: isCurrentlyInvalid ? undefined : revocationReason,
          };
        }
        return c;
      })
    );

    const actionText = isCurrentlyInvalid ? 'restored to Valid' : 'marked as Invalid (Revoked)';
    showToast(`Certificate ${revokeModalCert.id} has been ${actionText}.`);
    setRevokeModalCert(null);
    apiService.triggerBlockchainChange?.();
  };

  // ACTION 4: Issue Certificate via Backend (Real PDFKit + QR + SHA-256)
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await apiService.generateCertificate({
        studentName: issueForm.studentName,
        rollNumber: issueForm.rollNumber || `RN-${Math.floor(100 + Math.random() * 900)}`,
        course: issueForm.course,
        department: issueForm.department,
        institution: issueForm.institution || 'Government Polytechnic Amravati',
        issueDate: issueForm.issueDate,
        grade: issueForm.grade,
      });

      if (res && res.success && res.data) {
        const newCert = res.data;
        setCertificates((prev) => [newCert, ...prev]);
        setIsIssueModalOpen(false);
        setIssueForm({
          studentName: '',
          rollNumber: '',
          course: 'Diploma in Computer Engineering',
          department: 'Computer Engineering',
          institution: 'Government Polytechnic Amravati',
          issueDate: new Date().toISOString().split('T')[0],
          grade: 'First Class with Distinction',
        });
        showToast(`Certificate ${newCert.id} issued and anchored to blockchain successfully!`);
        apiService.triggerBlockchainChange?.();
        // Immediately open preview modal showing the generated PDF
        setViewModalCert(newCert);
      } else {
        showToast(res?.message || 'Failed to generate certificate', 'error');
      }
    } catch (err) {
      console.error('Error generating certificate:', err);
      showToast('Backend connection error while generating certificate.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const copyHash = (hash) => {
    navigator.clipboard?.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium animate-fadeIn ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#1F3D2B] text-white'
            }`}
        >
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-3xl font-bold text-[#1A1A1A]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif' " }}
          >
            Certificates Management
          </h1>
          <p className="text-gray-500 mt-1">
            Issue, inspect, download real PDFs, and manage cryptographic anchors on the blockchain.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCertificates}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-full font-medium text-sm hover:bg-gray-200 transition-colors cursor-pointer"
            title="Refresh certificates from backend"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F3D2B] text-white rounded-full font-medium text-sm hover:bg-[#16281C] transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Issue Certificate
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by certificate ID, student name, or course..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] focus:border-transparent text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] focus:border-transparent text-sm cursor-pointer"
        >
          <option value="All">All Status</option>
          <option value="Valid">Valid</option>
          <option value="Pending">Pending</option>
          <option value="Invalid">Invalid (Revoked)</option>
        </select>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Certificate ID
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Course & Degree
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedCertificates.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No certificates found. Issue your first certificate using the button above.
                  </td>
                </tr>
              ) : (
                paginatedCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-bold text-[#1F3D2B] bg-green-50/50 px-2 py-1 rounded border border-green-200">
                        {cert.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">{cert.studentName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{cert.course}</span>
                      {cert.grade && (
                        <span className="text-[11px] text-gray-400 block">{cert.grade}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{cert.issueDate}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig[cert.status] || 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {cert.status === 'Valid' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : cert.status === 'Invalid' ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Action Button */}
                        <button
                          onClick={() => handleView(cert)}
                          className="p-2 text-gray-600 hover:text-[#1F3D2B] hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                          title="View Certificate Details & QR"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Download Real PDF Button */}
                        <button
                          onClick={() => handleDownload(cert)}
                          className="p-2 text-gray-600 hover:text-[#1F3D2B] hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                          title="Download Official PDF Certificate"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Revoke / Restore Action Button */}
                        <button
                          onClick={() => openRevokeModal(cert)}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${cert.status === 'Invalid'
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                            }`}
                          title={cert.status === 'Invalid' ? 'Restore Certificate' : 'Revoke Certificate'}
                        >
                          {cert.status === 'Invalid' ? (
                            <RotateCcw className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-800">{paginatedCertificates.length}</span> of{' '}
            <span className="font-semibold text-gray-800">{filteredCertificates.length}</span> certificates
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${currentPage === pageNum
                    ? 'bg-[#1F3D2B] text-white'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW CERTIFICATE DETAILS, REAL QR & PDF PREVIEW                   */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODAL 1: VIEW OFFICIAL CERTIFICATE (ACADEMIC PREVIEW & PDF VIEWER)        */}
      {/* ========================================================================= */}
      {viewModalCert && (() => {
        const certId = viewModalCert.certificateId || viewModalCert.id;
        const verificationUrl = viewModalCert.verificationUrl || `https://sayalijogi26-alt.github.io/Blockvault-1/#/verify/${certId}`;
        const securePdfUrl = `${apiService.BACKEND_URL}/certificates/${certId}.pdf`;

        return (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100 max-h-[92vh] flex flex-col">
              {/* Modal Topbar */}
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-emerald-50/30 border-b border-gray-200 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1F3D2B]/10 flex items-center justify-center text-[#1F3D2B]">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-gray-900 tracking-wide uppercase">
                      Certificate {certId}
                    </span>
                    <span className="hidden sm:inline-block text-xs text-gray-500 ml-2">
                      • {viewModalCert.studentName}
                    </span>
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200 text-xs font-semibold">
                    <button
                      onClick={() => setPreviewMode('certificate')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${previewMode === 'certificate'
                          ? 'bg-[#1F3D2B] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      Certificate View
                    </button>
                    <button
                      onClick={() => setPreviewMode('pdf')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${previewMode === 'pdf'
                          ? 'bg-[#1F3D2B] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      PDF Document
                    </button>
                  </div>

                  <button
                    onClick={() => setViewModalCert(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 flex flex-col bg-gray-50/50">
                {previewMode === 'certificate' ? (
                  /* ========================================================================= */
                  /* HIGH-FIDELITY ACADEMIC CERTIFICATE CANVAS (ALWAYS RENDERS INSTANTLY)      */
                  /* ========================================================================= */
                  <div className="relative w-full bg-[#FCFBF7] rounded-2xl border-4 border-[#1F3D2B] shadow-lg p-6 sm:p-8 text-[#1A1A1A] overflow-hidden">
                    {/* Inner gold decorative border */}
                    <div className="absolute inset-2 sm:inset-3 border border-[#C5A059] rounded-xl pointer-events-none opacity-80" />
                    <div className="absolute inset-2.5 sm:inset-3.5 border-2 border-[#1F3D2B]/15 rounded-lg pointer-events-none" />

                    {/* Corner accents */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#C5A059]" />
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#C5A059]" />
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#C5A059]" />
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#C5A059]" />

                    {/* Certificate Content Header */}
                    <div className="text-center relative z-10 pt-2 pb-4 border-b border-[#C5A059]/30">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#1F3D2B] text-xs font-bold tracking-wider uppercase mb-2 border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Official Academic Credential
                      </div>
                      <h2
                        className="text-xl sm:text-2xl font-black text-[#1F3D2B] tracking-wide"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      >
                        {viewModalCert.institution || 'GOVERNMENT POLYTECHNIC AMRAVATI'}
                      </h2>
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">
                        Autonomous Institute of Government of Maharashtra • Established 1955
                      </p>
                    </div>

                    {/* Certificate Main Title */}
                    <div className="text-center my-5 relative z-10">
                      <div className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">
                        Learn • Grow • Achieve
                      </div>
                      <h3
                        className="text-2xl sm:text-3xl font-extrabold text-[#1F3D2B] tracking-tight mt-1"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      >
                        CERTIFICATE OF ACHIEVEMENT
                      </h3>
                      <div className="w-24 h-0.5 bg-[#C5A059] mx-auto mt-2 mb-4" />

                      <p className="text-xs sm:text-sm text-gray-600 italic">This is to officially certify that</p>
                      <h4
                        className="text-2xl sm:text-3xl font-bold text-gray-900 my-2 tracking-wide text-emerald-950"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      >
                        {viewModalCert.studentName}
                      </h4>
                      <p className="text-xs text-gray-600 font-mono font-medium">
                        Roll Number: <span className="text-gray-900 font-bold">{viewModalCert.rollNumber || 'N/A'}</span>
                      </p>

                      <p className="text-xs sm:text-sm text-gray-600 mt-3">
                        has successfully completed the prescribed curriculum and examination for the program of
                      </p>
                      <div className="text-lg sm:text-xl font-bold text-[#1F3D2B] mt-1">
                        {viewModalCert.course}
                      </div>
                      <p className="text-xs text-gray-500">
                        Department of {viewModalCert.department || 'Computer Engineering'}
                      </p>

                      <div className="inline-block mt-3 px-4 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200">
                        Grade Awarded: {viewModalCert.grade || 'First Class with Distinction'}
                      </div>
                    </div>

                    {/* Certificate Lower Details: Verification, QR, and Signatures */}
                    <div className="mt-6 pt-5 border-t border-[#C5A059]/30 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end relative z-10 text-xs">
                      {/* Left: Authority Signature */}
                      <div className="text-center sm:text-left">
                        <div className="h-10 flex items-center justify-center sm:justify-start">
                          <span
                            className="text-base sm:text-lg text-emerald-900 italic font-serif"
                            style={{ fontFamily: "'Brush Script MT', cursive, serif" }}
                          >
                            Dr. V. M. Mohitkar
                          </span>
                        </div>
                        <div className="w-32 border-t border-gray-400 mx-auto sm:mx-0 my-1" />
                        <p className="font-bold text-gray-800">Head of Department</p>
                        <p className="text-[10px] text-gray-500">Government Polytechnic Amravati</p>
                      </div>

                      {/* Middle: Blockchain Credential Seal & QR Code */}
                      <div className="text-center flex flex-col items-center justify-center order-last sm:order-none">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-200">
                          <QRCodeSVG
                            value={verificationUrl}
                            size={92}
                            level="H"
                            includeMargin={false}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 font-semibold mt-1">
                          Scan to Verify Live
                        </span>
                        <span className="text-[9px] text-[#1F3D2B] font-mono mt-0.5 font-bold">
                          {certId}
                        </span>
                      </div>

                      {/* Right: Principal Signature */}
                      <div className="text-center sm:text-right">
                        <div className="h-10 flex items-center justify-center sm:justify-end">
                          <span
                            className="text-base sm:text-lg text-emerald-900 italic font-serif"
                            style={{ fontFamily: "'Brush Script MT', cursive, serif" }}
                          >
                            Prof. A. R. Patil
                          </span>
                        </div>
                        <div className="w-32 border-t border-gray-400 mx-auto sm:ml-auto sm:mr-0 my-1" />
                        <p className="font-bold text-gray-800">Principal / Registrar</p>
                        <p className="text-[10px] text-gray-500">Date: {viewModalCert.issueDate}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ========================================================================= */
                  /* PDF DOCUMENT VIEW EMBED WITH SECURE HTTPS URL                             */
                  /* ========================================================================= */
                  <div className="flex-1 flex flex-col space-y-3">
                    <div className="flex items-center text-xs bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-[#1F3D2B]">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <FileCheck className="w-4 h-4 text-emerald-700" />
                        Official PDFKit Document: {certId}.pdf
                      </span>
                    </div>

                    <div className="relative w-full h-[65vh] min-h-[480px] bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm flex flex-col">
                      <iframe
                        src={`${securePdfUrl}#toolbar=0&navpanes=0&pagemode=none&view=FitH`}
                        title={`Certificate PDF ${certId}`}
                        className="w-full flex-1 border-0"
                      />
                    </div>
                  </div>
                )}

                {/* Cryptographic Ledger Strip */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs items-center shadow-sm">
                  <div>
                    <span className="text-gray-500 block font-semibold mb-0.5">Status:</span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${statusConfig[viewModalCert.status] || 'bg-gray-100'
                        }`}
                    >
                      {viewModalCert.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 block font-semibold mb-0.5">SHA-256 PDF Digest:</span>
                    <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-lg border border-gray-200 font-mono text-[10px] text-gray-700">
                      <span className="truncate flex-1">{viewModalCert.sha256 || viewModalCert.hash}</span>
                      <button
                        onClick={() => copyHash(viewModalCert.sha256 || viewModalCert.hash)}
                        className="p-1 hover:text-[#1F3D2B] text-gray-500 cursor-pointer"
                        title="Copy full hash"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="md:text-right">
                    <span className="text-gray-500 block font-semibold mb-0.5">Blockchain Ledger:</span>
                    <button
                      onClick={() => {
                        setViewModalCert(null);
                        navigate('/admin/blockchain');
                      }}
                      className="text-xs text-[#1F3D2B] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <strong>{viewModalCert.blockNumber || 'Block #1'}</strong> (Inspect Ledger) <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(viewModalCert)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>

                  <a
                    href={securePdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <FileText className="w-4 h-4" /> Open Full PDF in New Tab
                  </a>
                </div>

                <button
                  onClick={() => setViewModalCert(null)}
                  className="px-6 py-2.5 bg-[#1F3D2B] text-white rounded-xl text-sm font-medium hover:bg-[#16281C] transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 2: REVOKE OR RESTORE CONFIRMATION                                   */}
      {/* ========================================================================= */}
      {revokeModalCert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={`w-5 h-5 ${revokeModalCert.status === 'Invalid' ? 'text-green-600' : 'text-red-600'
                    }`}
                />
                <h3 className="font-bold text-lg text-gray-900">
                  {revokeModalCert.status === 'Invalid' ? 'Restore Certificate' : 'Revoke Certificate'}
                </h3>
              </div>
              <button
                onClick={() => setRevokeModalCert(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-sm text-gray-600">
              <p>
                Target Certificate: <strong className="text-gray-900">{revokeModalCert.id}</strong> (
                {revokeModalCert.studentName} — {revokeModalCert.course})
              </p>

              {revokeModalCert.status !== 'Invalid' ? (
                <>
                  <p className="text-red-600 text-xs font-semibold">
                    Revoking this certificate will invalidate it across the verification portal and anchor a
                    revocation block to the blockchain ledger.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Reason for Revocation
                    </label>
                    <select
                      value={revocationReason}
                      onChange={(e) => setRevocationReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
                    >
                      <option value="Administrative Review">Administrative Review</option>
                      <option value="Grade recalculation discrepancy">Grade recalculation discrepancy</option>
                      <option value="Disciplinary Academic Misconduct">Disciplinary Academic Misconduct</option>
                      <option value="Credential Expired or Superseded">Credential Expired or Superseded</option>
                    </select>
                  </div>
                </>
              ) : (
                <p className="text-green-700 text-xs font-semibold">
                  This certificate is currently marked as Invalid. Confirming will reinstate it back to 'Valid' status.
                </p>
              )}
            </div>

            <div className="pt-3 flex gap-3">
              <button
                onClick={() => setRevokeModalCert(null)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className={`flex-1 py-2.5 text-white rounded-xl text-sm font-medium transition-colors cursor-pointer ${revokeModalCert.status === 'Invalid'
                    ? 'bg-green-700 hover:bg-green-800'
                    : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {revokeModalCert.status === 'Invalid' ? 'Confirm Restore' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ISSUE REAL DIGITAL CERTIFICATE VIA BACKEND                       */}
      {/* ========================================================================= */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#1F3D2B]" />
                <h3 className="font-bold text-xl text-gray-900">Issue Real Digital Certificate</h3>
              </div>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sayali Jogi"
                  value={issueForm.studentName}
                  onChange={(e) => setIssueForm({ ...issueForm, studentName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Roll / Registration No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 101"
                    value={issueForm.rollNumber}
                    onChange={(e) => setIssueForm({ ...issueForm, rollNumber: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Engineering"
                    value={issueForm.department}
                    onChange={(e) => setIssueForm({ ...issueForm, department: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Course / Program Degree *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diploma in Computer Engineering"
                  value={issueForm.course}
                  onChange={(e) => setIssueForm({ ...issueForm, course: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Institution / College Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Government Polytechnic Amravati"
                  value={issueForm.institution}
                  onChange={(e) => setIssueForm({ ...issueForm, institution: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Date of Issuance
                  </label>
                  <input
                    type="date"
                    required
                    value={issueForm.issueDate}
                    onChange={(e) => setIssueForm({ ...issueForm, issueDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Grade / Classification
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. First Class with Distinction"
                    value={issueForm.grade}
                    onChange={(e) => setIssueForm({ ...issueForm, grade: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F3D2B]"
                  />
                </div>
              </div>

              <div className="p-3 bg-green-50/70 rounded-xl border border-green-200 text-xs text-gray-600">
                <p className="font-semibold text-[#1F3D2B] mb-1">Real Backend Integration:</p>
                <p>
                  Upon submission, the Node.js backend generates an authentic high-resolution A4 landscape PDF using PDFKit, calculates the cryptographic SHA-256 digest, embeds an authentication QR code, and anchors the credential directly into the blockchain ledger.
                </p>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#1F3D2B] text-white rounded-xl text-sm font-medium hover:bg-[#16281C] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Generating PDF & Anchoring...' : 'Issue & Anchor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
