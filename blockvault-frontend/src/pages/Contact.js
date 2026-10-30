import React, { useState } from 'react';
import { MapPin, Mail, Phone, ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import apiService from '../services/api';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiService.sendContactMessage(formData);
      if (res && res.success) {
        setSuccessMessage(res.message || 'Your message has been delivered successfully to the BlockVault support team!');
        setSubmitted(true);
      } else {
        setError(res?.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Contact email error:', err);
      setError(err?.response?.data?.message || err?.message || 'Unable to connect to the email server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] py-20 px-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1
            className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Contact <span className="italic text-[#1F3D2B]">Us</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-lg mx-auto">
            Have questions about BlockVault? Get in touch with our team.
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Left: Contact Form */}
          <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-8 md:p-10">
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-[#1F3D2B] mx-auto mb-4" />
                <h3
                  className="text-2xl font-bold text-[#1A1A1A] mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Message Sent to Email!
                </h3>
                <p className="text-gray-600 mb-2">
                  Thank you for reaching out, <strong>{formData.name}</strong>.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  {successMessage || 'Your message has been delivered to the BlockVault support team. We will get back to you shortly.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', subject: '', message: '' });
                  }}
                  className="px-6 py-2.5 rounded-full border border-[#1F3D2B] text-[#1F3D2B] text-sm font-medium hover:bg-[#1F3D2B] hover:text-white transition-colors cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm space-y-2">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                    <div className="pt-2 border-t border-red-200/60 flex items-center justify-between text-xs">
                      <span>Prefer sending directly?</span>
                      <a
                        href={`mailto:blockvault0926@gmail.com?subject=${encodeURIComponent(formData.subject || 'BlockVault Inquiry')}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`)}`}
                        className="font-medium text-[#1F3D2B] hover:underline inline-flex items-center gap-1"
                      >
                        <Mail className="w-3.5 h-3.5" /> Open in Email Client
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Sayali Jogi"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] focus:border-transparent text-sm transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] focus:border-transparent text-sm transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Certificate Verification Query"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] focus:border-transparent text-sm transition-all"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Describe your inquiry or problem here..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1F3D2B] focus:border-transparent text-sm transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#1F3D2B] text-white font-medium hover:bg-[#16281C] transition-colors shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending Email...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" /> Send Email Message <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right: Info Card + Map */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-8">
              <h3
                className="text-2xl font-bold text-[#1A1A1A] mb-6"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Get In Touch
              </h3>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F5F1E9] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#1F3D2B]" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block">
                      Institution / Office
                    </span>
                    <span className="text-sm text-gray-700 font-medium">
                      Government Polytechnic Amravati, Maharashtra, India
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F5F1E9] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-[#1F3D2B]" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block">
                      Support Inquiries
                    </span>
                    <a
                      href="mailto:blockvault0926@gmail.com"
                      className="text-sm text-[#1F3D2B] font-medium hover:underline"
                    >
                      blockvault0926@gmail.com
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#F5F1E9] flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-[#1F3D2B]" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block">
                      Helpline
                    </span>
                    <a
                      href="tel:+919876543210"
                      className="text-sm text-gray-700 font-medium hover:underline"
                    >
                      +91 (0721) 2660188
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            {/* Embedded Location Card */}
            <div className="bg-white rounded-[16px] shadow-sm border border-gray-100 p-6 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-6 h-6 text-[#1F3D2B]" />
                <h4 className="font-bold text-gray-800">Campus Location</h4>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Government Polytechnic, Gadge Nagar, Amravati, Maharashtra 444603
              </p>
              <p className="text-xs text-gray-400">
                Authorized issuing authority for BlockVault verified digital credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
