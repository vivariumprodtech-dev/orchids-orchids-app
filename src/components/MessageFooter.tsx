import React from "react";

interface MessageFooterProps {
  message: string;
}

export default function MessageFooter({ message }: MessageFooterProps) {
  if (!message) return null;

  return (
    <div
      style={{
        marginTop:       "var(--spacing-1)",
        textAlign:       "center",
        padding:         "var(--spacing-3) var(--spacing-4)",
        borderRadius:    "var(--rounded-4)",
        backgroundColor: "var(--neutral-bg)",
      }}
    >
      <span className="body-md" style={{ color: "var(--subtitle-2)", fontStyle: "italic", fontWeight: 600 }}>
        {message}
      </span>
    </div>
  );
}
