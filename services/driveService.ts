
/**
 * Google Drive Indexer
 * Uses the files.list API to crawl a public folder.
 */

const API_KEY = process.env.API_KEY;

/**
 * Recursively or flat-list files from a Google Drive folder.
 * For performance, we fetch subfolders and image files to build the map.
 */
export const crawlDriveFolder = async (folderId: string): Promise<Record<string, string[]>> => {
  if (!API_KEY) {
    console.error("[DriveService] System API Key missing from environment.");
    throw new Error("Core System Error: Identity Key missing.");
  }
  
  const assetMap: Record<string, string[]> = {};

  try {
    console.log(`[DriveService] Initiating archive crawl for Root ID: ${folderId}`);

    // 1. Get all subfolders (Students)
    const studentsRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&key=${API_KEY}&fields=files(id,name)`
    );
    
    if (!studentsRes.ok) {
      const err = await studentsRes.json();
      console.error("[DriveService] Drive API Rejection:", err);
      throw new Error(err.error?.message || "Secure archive connection refused.");
    }

    const studentsData = await studentsRes.json();
    const studentFolders = studentsData.files || [];
    
    console.log(`[DriveService] Access confirmed. Found ${studentFolders.length} dossiers.`);

    for (const folder of studentFolders) {
      const studentKey = folder.name.toLowerCase().replace(/\s+/g, '_');
      
      // 2. For each student, get category subfolders (class, hostess, etc)
      const catRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&key=${API_KEY}&fields=files(id,name)`
      );
      const catData = await catRes.json();
      const categories = catData.files || [];

      for (const cat of categories) {
        const catName = cat.name.toLowerCase();
        
        // 3. Get all images in this category subfolder
        const imgRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${cat.id}'+in+parents+and+mimeType+contains+'image/'+and+trashed=false&key=${API_KEY}&fields=files(id,name)`
        );
        const imgData = await imgRes.json();
        const images = imgData.files || [];

        const mapKey = `${studentKey}/${catName}`;
        assetMap[mapKey] = images.map((img: any) => 
          // Direct view URL for browser compatibility
          `https://drive.google.com/uc?id=${img.id}&export=view`
        );
      }

      // 4. Also check for images directly in the student folder
      const directImgRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents+and+mimeType+contains+'image/'+and+trashed=false&key=${API_KEY}&fields=files(id,name)`
      );
      const directImgData = await directImgRes.json();
      const directImages = directImgData.files || [];

      directImages.forEach((img: any) => {
        // Pattern match: "hostess_1.png" -> category "hostess"
        const namePart = img.name.split('.')[0].split('_')[0].toLowerCase();
        const mapKey = `${studentKey}/${namePart}`;
        if (!assetMap[mapKey]) assetMap[mapKey] = [];
        assetMap[mapKey].push(`https://drive.google.com/uc?id=${img.id}&export=view`);
      });
    }

    console.log(`[DriveService] Indexing complete. Total categories mapped: ${Object.keys(assetMap).length}`);
    return assetMap;
  } catch (error: any) {
    console.error("[DriveService] Fatal Sync Error:", error);
    throw error;
  }
};
