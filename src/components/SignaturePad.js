"use client";

import React, { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';

const SignaturePadComponent = ({ 
  onSignatureChange, 
  initialSignature = null,
  width = 400,
  height = 200,
  className = "",
  readonly = false
}) => {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize signature pad
    signaturePadRef.current = new SignaturePad(canvasRef.current, {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      penColor: 'rgb(45, 166, 162)',
      velocityFilterWeight: 0.7,
      minWidth: 1,
      maxWidth: 2,
      throttle: 16,
      minDistance: 5,
    });

    // Load initial signature if provided
    if (initialSignature) {
      signaturePadRef.current.fromDataURL(initialSignature);
    }

    // Handle signature change
    const handleBegin = () => {
      setIsDrawing(true);
    };

    const handleEnd = () => {
      setIsDrawing(false);
      if (onSignatureChange && signaturePadRef.current) {
        const signatureData = signaturePadRef.current.toDataURL();
        onSignatureChange(signatureData);
      }
    };

    signaturePadRef.current.addEventListener('beginStroke', handleBegin);
    signaturePadRef.current.addEventListener('endStroke', handleEnd);

    // Handle resize
    const handleResize = () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.clear();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.removeEventListener('beginStroke', handleBegin);
        signaturePadRef.current.removeEventListener('endStroke', handleEnd);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [onSignatureChange, initialSignature]);

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      if (onSignatureChange) {
        onSignatureChange(null);
      }
    }
  };

  const isEmpty = () => {
    return signaturePadRef.current ? signaturePadRef.current.isEmpty() : true;
  };

  // If signature exists and readonly mode, show signature status
  if (initialSignature && readonly) {
    return (
      <div className={`signature-pad-container ${className}`}>
        <div className="border-2 border-green-300 rounded-lg overflow-hidden bg-white p-4">
          <div className="flex items-center justify-center h-32 bg-green-50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-semibold text-green-600">Đã ký</span>
              </div>
              <p className="text-sm text-gray-600">Chữ ký đã được lưu</p>
            </div>
          </div>
        </div>
        
        {/* Controls for readonly mode */}
        <div className="flex justify-between items-center mt-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              Chữ ký đã hoàn thành
            </span>
          </div>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-1 text-sm bg-[#2DA6A2] text-white rounded hover:bg-[#2DA6A2]/90 transition-colors"
            >
              {showPreview ? 'Ẩn' : 'Xem lại'}
            </button>
          </div>
        </div>

        {/* Preview modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Xem lại chữ ký</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                <img 
                  src={initialSignature} 
                  alt="Chữ ký" 
                  className="w-full h-auto"
                  style={{ maxHeight: '400px' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`signature-pad-container ${className}`}>
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full cursor-crosshair"
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            maxWidth: `${width}px`,
            maxHeight: `${height}px`
          }}
        />
      </div>
      
      {/* Controls */}
      <div className="flex justify-between items-center mt-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {isDrawing ? 'Đang ký...' : 'Vui lòng ký vào ô trên'}
          </span>
        </div>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={clearSignature}
            disabled={isEmpty()}
            className="px-3 py-1 text-sm text-gray-600 hover:text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignaturePadComponent;
