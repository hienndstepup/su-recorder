import {useRef, useState, useEffect} from 'react'

export const useRecord = () => {
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingBlob, setRecordingBlob] = useState(null)

  useEffect(() => {
    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startRecording = async () => {
    if (typeof window === 'undefined' || !navigator?.mediaDevices) {
      alert('Trình duyệt của bạn không hỗ trợ ghi âm')
      return
    }

    try {
      const { default: RecordRTC } = await import('recordrtc')
      const stream = await navigator.mediaDevices.getUserMedia({audio: true})
      streamRef.current = stream

      recorderRef.current = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
        bufferSize: 4096,
      })

      recorderRef.current.startRecording()
      setIsRecording(true)
    } catch (error) {
      console.error('Lỗi truy cập microphone:', error)
      alert('Lỗi truy cập microphone')
    }
  }

  const stopRecording = () => {
    return new Promise((resolve) => {
      if (recorderRef.current) {
        recorderRef.current.stopRecording(() => {
          // Lấy blob mới nhất từ recorder
          const blob = recorderRef.current?.getBlob() || null
          
          // Dọn dẹp
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
          }
          setIsRecording(false)
          
          // Trả về blob mới nhất qua Promise
          resolve(blob)
        })
      } else {
        resolve(null)
      }
    })
  }

  return [isRecording, recordingBlob, startRecording, stopRecording]
}
