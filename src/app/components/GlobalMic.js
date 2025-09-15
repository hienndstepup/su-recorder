'use client'

import {useMemo} from 'react'
import {useRecord} from '@/hooks/useRecord'
import Lottie from 'lottie-react'
import micAnim from '/public/lotties/mic.json'

const GlobalMic = ({
  width = 100,
  height = 64,
  className = '',
  onComplete,
  onStart,
  disabled = false,
}) => {
  const [isRecording, recordingBlob, startRecording, stopRecording] = useRecord()

  const dimension = useMemo(() => ({
    width,
    height,
    radius: 50,
  }), [width, height])

  const handleToggle = async () => {
    if (disabled) return
    if (isRecording) {
      // Lấy blob mới nhất từ stopRecording
      const newBlob = await stopRecording()
      if (typeof onComplete === 'function' && newBlob) {
        onComplete(newBlob)
      }
    } else {
      await startRecording()
      if (typeof onStart === 'function') {
        onStart()
      }
    }
  }

  const idleColors = ['#2DA6A2', '#2DA6A2']
  const recordingColors = ['#FFA654', '#FF7D2C']
  const [c1, c2] = isRecording ? recordingColors : idleColors

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center select-none transition-transform active:scale-95 border-0 outline-none focus:outline-none ring-0 focus:ring-0 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      style={{
        width: dimension.width,
        height: dimension.height,
        borderRadius: dimension.radius,
        minHeight: 44,
        WebkitTapHighlightColor: 'transparent',
      }}
      aria-label={isRecording ? 'Đang ghi âm, bấm để dừng' : 'Bấm để ghi âm'}
    >
      <div
        className="absolute inset-0"
        style={{
          borderRadius: dimension.radius,
          background: `linear-gradient(286deg, ${c1} 28%, ${c2} 86%)`,
        }}
      />

      <div className="relative z-10 flex items-center justify-center w-full h-full">
        {isRecording ? (
          <Lottie
            animationData={micAnim}
            loop
            autoplay
            className="w-full h-full"
          />
        ) : (
          <img src="/assets/mic.svg" alt="Mic" className="w-10 h-10" />
        )}
      </div>
    </button>
  )
}

export default GlobalMic