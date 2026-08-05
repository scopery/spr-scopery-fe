/** Trigger a browser file download from an ArrayBuffer. */
export function triggerBrowserDownload(buffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

/** Sanitize a file stem for Excel downloads (no extension). */
export function safeExcelFileStem(value: string | null | undefined, fallback: string): string {
  return (value || fallback).replace(/[/\\?*[\]:]/g, '-').slice(0, 80) || fallback
}

/** Normalize ExcelJS writeBuffer result to ArrayBuffer. */
export function excelWriteBufferToArrayBuffer(
  buffer: ArrayBuffer | Uint8Array | ArrayLike<number>
): ArrayBuffer {
  if (buffer instanceof ArrayBuffer) return buffer
  if (buffer instanceof Uint8Array) {
    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer
  }
  return Uint8Array.from(buffer).buffer
}
