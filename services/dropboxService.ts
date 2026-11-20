
/**
 * Dropbox Asset Service
 * Handles recursive folder crawling and temporary link generation.
 */

export const crawlDropbox = async (token: string, rootPath: string): Promise<Record<string, string[]>> => {
  if (!token) throw new Error("Dropbox Access Token missing.");
  
  const assetMap: Record<string, string[]> = {};
  let normalizedPath = rootPath.trim();
  if (normalizedPath === '/') normalizedPath = '';
  if (normalizedPath && !normalizedPath.startsWith('/')) normalizedPath = '/' + normalizedPath;

  try {
    console.log(`[DropboxService] Initiating crawl for path: "${normalizedPath || "Root"}"`);

    const listResponse = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: normalizedPath,
        recursive: true,
        include_media_info: false,
        include_deleted: false
      })
    });

    if (!listResponse.ok) {
      const err = await listResponse.json();
      // Explicitly stringify the error object to avoid [object Object]
      const summary = err.error_summary || JSON.stringify(err.error) || JSON.stringify(err);
      console.error("[DropboxService] API Error:", summary);
      
      if (summary.includes("expired_access_token")) {
        throw new Error("Your Dropbox session has expired. Please generate a new access token in the App Console.");
      }
      throw new Error(summary);
    }

    const data = await listResponse.json();
    const entries = data.entries || [];
    
    const imageFiles = entries.filter((e: any) => 
      e['.tag'] === 'file' && 
      /\.(jpg|jpeg|png|webp)$/i.test(e.name)
    );

    for (const file of imageFiles) {
      const relativePath = file.path_lower.replace(normalizedPath.toLowerCase(), '');
      const pathParts = relativePath.split('/').filter(Boolean);
      
      if (pathParts.length >= 2) {
        const studentName = pathParts[0].replace(/\s+/g, '_');
        const category = pathParts[1].replace(/\s+/g, '_');
        const key = `${studentName}/${category}`;

        if (!assetMap[key]) assetMap[key] = [];
        assetMap[key].push(file.path_display);
      }
    }

    return assetMap;
  } catch (error: any) {
    const msg = error.message || JSON.stringify(error);
    console.error("[DropboxService] Fatal Error:", msg);
    throw new Error(msg);
  }
};

export const getDropboxLink = async (token: string, path: string): Promise<string> => {
  try {
    const response = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path })
    });

    if (!response.ok) {
      const err = await response.json();
      const summary = err.error_summary || JSON.stringify(err.error) || JSON.stringify(err);
      if (summary.includes("expired_access_token")) {
        throw new Error("expired_access_token");
      }
      throw new Error(summary);
    }

    const data = await response.json();
    return data.link;
  } catch (e: any) {
    throw new Error(e.message || "Failed to retrieve asset link.");
  }
};
