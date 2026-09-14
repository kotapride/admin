import React, { useRef, useState, useEffect } from 'react';
import { Download, X, Loader2, Camera, UploadCloud } from 'lucide-react';
import html2canvas from 'html2canvas';
import './Certificate.css';

export default function CertificateGenerator({ student, onClose, token, onPhotoUpdated }) {
  const certificateRef = useRef(null);
  const photoInputRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [photoUpdating, setPhotoUpdating] = useState(false);
  const [studentPhoto, setStudentPhoto] = useState(student?.photo_url || null);

  // Synchronize when student prop updates
  useEffect(() => {
    if (student?.photo_url) {
      setStudentPhoto(student.photo_url);
    }
  }, [student?.photo_url]);

  if (!student) return null;

  // Handle Photo selection and upload
  const handlePhotoSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setPhotoUpdating(true);
      try {
        const studentId = student.id;
        const response = await fetch(`/api/records/${studentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            photoBase64: base64,
            photoMimeType: file.type,
            photoFileName: file.name
          })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to update student photo.');
        }

        const updatedUrl = data.record.photo_url;
        setStudentPhoto(updatedUrl);

        if (typeof onPhotoUpdated === 'function') {
          onPhotoUpdated(data.record);
        }
      } catch (err) {
        console.error('Error updating photo:', err);
        alert(`Failed to update photo: ${err.message}`);
      } finally {
        setPhotoUpdating(false);
        if (photoInputRef.current) photoInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  // Convert remote image URL to base64 data URL to avoid CORS canvas taint
  const convertUrlToDataUri = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Could not convert image to DataURI, falling back to original URL:', e);
      return url;
    }
  };

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setDownloading(true);

    try {
      // Temporarily swap student photo with base64 if remote to guarantee no CORS taint
      const photoImgEl = certificateRef.current.querySelector('.cert-student-photo-frame img');
      let originalImgSrc = null;
      if (photoImgEl && studentPhoto && studentPhoto.startsWith('http')) {
        originalImgSrc = photoImgEl.src;
        const base64Data = await convertUrlToDataUri(studentPhoto);
        photoImgEl.src = base64Data;
        // Brief pause to ensure image element paints the base64 src
        await new Promise((r) => setTimeout(r, 100));
      }

      // Temporarily remove transform on the wrapper for html2canvas
      const wrapper = certificateRef.current.parentElement;
      const originalTransform = wrapper.style.transform;
      wrapper.style.transform = 'none';

      // html2canvas capture at 2x resolution
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      // Restore transform and original image src
      wrapper.style.transform = originalTransform;
      if (photoImgEl && originalImgSrc) {
        photoImgEl.src = originalImgSrc;
      }

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
      {/* Hidden file input for photo upload */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handlePhotoSelect}
      />

      <div className="cert-actions">
        <button onClick={handleDownload} className="btn-print" disabled={downloading || photoUpdating}>
          {downloading ? <Loader2 size={20} className="spin" /> : <Download size={20} />}
          {downloading ? 'Generating Image...' : 'Download Certificate (PNG)'}
        </button>

        <button
          onClick={() => photoInputRef.current?.click()}
          className="btn-photo-action"
          disabled={downloading || photoUpdating}
          title="Update or change the student's photo"
        >
          {photoUpdating ? <Loader2 size={18} className="spin" /> : <Camera size={18} />}
          {photoUpdating ? 'Updating Photo...' : studentPhoto ? 'Change Student Photo' : 'Upload Student Photo'}
        </button>

        <button onClick={onClose} className="btn-close-cert" disabled={downloading || photoUpdating}>
          <X size={20} /> Close
        </button>
      </div>

      {/* The Printable Area */}
      <div
        className="cert-scale-wrapper"
        style={{ transform: 'scale(min(1, calc(90vw / 1100)))', transformOrigin: 'top center' }}
      >
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

            {/* Student Photo at top right corner - Safely positioned clear of corner ribbons */}
            {(studentPhoto || !downloading) && (
              <div
                className="cert-student-photo-wrapper"
                title={!downloading ? "Click to change or upload student photo" : undefined}
                onClick={() => !downloading && !photoUpdating && photoInputRef.current?.click()}
              >
                <div className="cert-student-photo-frame">
                  {studentPhoto ? (
                    <>
                      <img
                        src={studentPhoto}
                        alt={student.full_name || student.name || 'Student'}
                        crossOrigin="anonymous"
                      />
                      {!downloading && (
                        <div className="cert-photo-hover-overlay">
                          {photoUpdating ? (
                            <Loader2 size={20} className="spin" />
                          ) : (
                            <>
                              <Camera size={18} />
                              <span>Change Photo</span>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    !downloading && (
                      <div className="cert-photo-placeholder">
                        {photoUpdating ? (
                          <Loader2 size={20} className="spin" />
                        ) : (
                          <>
                            <UploadCloud size={24} />
                            <span>+ Add Photo</span>
                          </>
                        )}
                      </div>
                    )
                  )}
                </div>
                {!downloading && <div className="cert-photo-caption">Student Photo</div>}
              </div>
            )}

            <div className="cert-header" style={{ justifyContent: 'center', width: '100%' }}>
              <div className="cert-title" style={{ alignItems: 'center', textAlign: 'center' }}>
                <h1>CERTIFICATE</h1>
                <h2>OF ACHIEVEMENT</h2>
              </div>
            </div>

            <div className="cert-presented">Proudly Presented To</div>

            <h3 className="cert-name">{student.full_name || student.name}</h3>

            <p className="cert-description">
              This certificate is proudly presented to recognize the successful completion and participation in the{' '}
              <strong>{student.course || 'Skill Development'}</strong> program. We acknowledge their dedication, effort,
              and commitment to skill development.
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

