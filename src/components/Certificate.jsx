import React, { useRef, useState } from 'react';
import { Download, X, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import './Certificate.css';

export default function CertificateGenerator({ student, onClose }) {
  const certificateRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!student) return null;

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setDownloading(true);
    
    try {
      // Temporarily remove transform on the wrapper for html2canvas
      const wrapper = certificateRef.current.parentElement;
      const originalTransform = wrapper.style.transform;
      wrapper.style.transform = 'none';

      // html2canvas requires the element to be visible
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, // 2x resolution for better print quality
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      // Restore transform
      wrapper.style.transform = originalTransform;

      const image = canvas.toDataURL('image/png');
      
      // Create automatic download link
      const link = document.createElement('a');
      link.href = image;
      const safeName = (student.full_name || student.name || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `${safeName}_Certificate.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="cert-overlay">
      <div className="cert-actions">
        <button onClick={handleDownload} className="btn-print" disabled={downloading}>
          {downloading ? <Loader2 size={20} className="spin" /> : <Download size={20} />} 
          {downloading ? 'Generating Image...' : 'Download Certificate (PNG)'}
        </button>
        <button onClick={onClose} className="btn-close-cert" disabled={downloading}>
          <X size={20} /> Close
        </button>
      </div>

      {/* The Printable Area */}
      <div className="cert-scale-wrapper" style={{ transform: 'scale(min(1, calc(90vw / 1100)))', transformOrigin: 'top center' }}>
        <div id="printable-certificate" className="cert-container" ref={certificateRef}>
          {/* Borders */}
          <div className="cert-border"></div>
          <div className="cert-inner-border"></div>

          {/* Ribbons */}
          <div className="ribbon-tr-navy"></div>
          <div className="ribbon-tr-gold"></div>
          <div className="ribbon-bl-navy"></div>
          <div className="ribbon-bl-gold"></div>

          <div className="cert-content">
            {/* Logo at top left corner */}
            <div style={{ position: 'absolute', top: '60px', left: '60px', zIndex: 30 }}>
              <img src="/logo.png" alt="PrepMagic Logo" style={{ maxWidth: '220px', height: 'auto' }} />
            </div>

            <div className="cert-header" style={{ justifyContent: 'center', width: '100%' }}>
              <div className="cert-title" style={{ alignItems: 'center', textAlign: 'center' }}>
                <h1>CERTIFICATE</h1>
                <h2>OF ACHIEVEMENT</h2>
              </div>
            </div>

            <div className="cert-presented">Proudly Presented To</div>
            
            <h3 className="cert-name">{student.full_name || student.name}</h3>
            
            <p className="cert-description">
              This certificate is proudly presented to recognize the successful completion and participation in the <strong>{student.course || 'Skill Development'}</strong> program. We acknowledge their dedication, effort, and commitment to skill development.
            </p>

            <div className="cert-footer">
              <div className="cert-signature">
                <div className="cert-signature-line"></div>
                <span>Admin Signature</span>
              </div>

              <div className="cert-seal">
                <div className="seal-ribbon-left"></div>
                <div className="seal-ribbon-right"></div>
                <div className="seal-circle">
                  <div className="seal-inner">
                    <div className="seal-stars">★★★</div>
                    <div className="seal-number">1</div>
                    <div className="seal-stars">★★★</div>
                  </div>
                </div>
              </div>

              <div className="cert-signature">
                <div className="cert-signature-line"></div>
                <span>Director Signature</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
