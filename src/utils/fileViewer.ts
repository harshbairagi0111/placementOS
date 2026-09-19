/**
 * Securely fetches and opens or downloads a document using Bearer token authentication.
 * Bypasses URL query parameter token passing (?token=...), preventing token exposure
 * in browser history, server logs, and referrer headers.
 */
export async function viewAuthenticatedFile(fileUrl: string, explicitToken?: string): Promise<void> {
  const token = explicitToken || localStorage.getItem('token');

  // If it's an external absolute URL (e.g. http:// or https:// outside /api/files), open directly
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(fileUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.error(`Failed to load file [${response.status}]: ${response.statusText}`);
      alert('Unable to load document. Please ensure you are logged in with permission to view this file.');
      return;
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // Open blob in new window/tab safely
    const newWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow) {
      // If popup was blocked, fallback to temporary download anchor
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    // Revoke object URL after timeout to free memory
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60000);
  } catch (error) {
    console.error('Error viewing document:', error);
    alert('An unexpected error occurred while fetching the document.');
  }
}
