"use client";

import { useRef, useState } from "react";

type DownloadButtonProps = {
  href: string;
  label: string;
  className?: string;
};

function getFilenameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null;

  const utf8Match = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].trim());
  }

  const asciiMatch = disposition.match(/filename\s*=\s*"([^"]+)"/i);
  if (asciiMatch?.[1]) return asciiMatch[1].trim();

  return null;
}

export function DownloadButton({ href, label, className }: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  async function handleDownload() {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(href, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fallbackName = label.toLowerCase().includes("resume")
        ? "Elijah_Frost_Resume.pdf"
        : "Elijah_Frost_CV.pdf";
      const filename =
        getFilenameFromDisposition(response.headers.get("content-disposition")) ?? fallbackName;

      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(error);
      setErrorMessage("Download failed. Please try again.");
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isLoading}
        className={className}
        aria-busy={isLoading}
      >
        <span className="relative inline-flex h-4 w-4 items-center justify-center">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`absolute h-4 w-4 transition-all duration-300 ease-out ${
              isLoading ? "scale-75 opacity-0" : "scale-100 opacity-100"
            }`}
            aria-hidden="true"
          >
            <path d="M10 3v8" />
            <path d="m6.75 8.75 3.25 3.25 3.25-3.25" />
            <path d="M4 14.5h12" />
          </svg>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            className={`absolute h-4 w-4 transition-all duration-300 ease-out ${
              isLoading ? "scale-100 animate-spin opacity-100" : "scale-75 opacity-0"
            }`}
            aria-hidden="true"
          >
            <path d="M10 3.5a6.5 6.5 0 1 1-4.6 1.9" />
          </svg>
        </span>
        <span>{label}</span>
      </button>
      {errorMessage ? (
        <span role="alert" aria-live="polite" className="text-xs text-red-600">
          {errorMessage}
        </span>
      ) : null}
    </div>
  );
}