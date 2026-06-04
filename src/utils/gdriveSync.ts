import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { SYNC_KEYS } from './dbSync';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request drive.file scope which gives full access to files created by this app
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory cache of the active Google API access token
let cachedAccessToken: string | null = null;
let cachedActiveUser: User | null = null;

/**
 * Perform Google Sign-In and fetch the Google Drive API Access Token
 */
export async function signInWithGoogleDrive(): Promise<{ user: User; accessToken: string }> {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Không lấy được Access Token từ Google Authentication.');
    }
    cachedAccessToken = credential.accessToken;
    cachedActiveUser = result.user;
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

/**
 * Retrieve the current cached access token or request a fallback
 */
export function getGoogleAccessToken(): string | null {
  return cachedAccessToken;
}

/**
 * Update cached access token (e.g. if passed down)
 */
export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
}

/**
 * Reset memory and sign out
 */
export async function logoutGoogleDrive(): Promise<void> {
  await signOut(auth);
  cachedAccessToken = null;
  cachedActiveUser = null;
}

/**
 * Find or create backup file in Google Drive and update it with LocalStorage payload
 */
export async function backupToGoogleDrive(accessToken: string): Promise<{ success: boolean; fileId: string; lastSynced: string }> {
  try {
    // 1. Gather all LocalStorage payload
    const payload: Record<string, any> = {};
    for (const key of SYNC_KEYS) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          payload[key] = JSON.parse(value);
        } catch (_) {
          payload[key] = value;
        }
      }
    }

    // 2. Search for existing ledgerflow_backup.json file
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='ledgerflow_backup.json'+and+trashed=false&fields=files(id,name)`;
    const searchRes = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!searchRes.ok) {
      throw new Error(`Google Drive API search failed with status ${searchRes.status}`);
    }

    const searchData = await searchRes.json();
    let fileId = '';

    if (searchData.files && searchData.files.length > 0) {
      fileId = searchData.files[0].id;
    } else {
      // Create a empty backup metadata first
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'ledgerflow_backup.json',
          mimeType: 'application/json',
          description: 'Sổ sách kế toán LedgerFlow Studio Backup'
        })
      });

      if (!createRes.ok) {
        throw new Error(`Google Drive API file creation failed with status ${createRes.status}`);
      }

      const createData = await createRes.json();
      fileId = createData.id;
    }

    // 3. Upload content to metadata file ID (PATCH uploadType=media)
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!uploadRes.ok) {
      throw new Error(`Google Drive backup upload failed with status ${uploadRes.status}`);
    }

    const timestamp = new Date().toLocaleTimeString('vi-VN');
    return { success: true, fileId, lastSynced: timestamp };
  } catch (error) {
    console.error('Google Drive Backup Error:', error);
    throw error;
  }
}

/**
 * Search and restore LedgerFlow data from Google Drive back to browser's LocalStorage
 */
export async function restoreFromGoogleDrive(accessToken: string): Promise<{ success: boolean; found: boolean; message: string }> {
  try {
    // 1. Search for existing ledgerflow_backup.json file
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='ledgerflow_backup.json'+and+trashed=false&fields=files(id,name)`;
    const searchRes = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!searchRes.ok) {
      throw new Error(`Google Drive API search failed with status ${searchRes.status}`);
    }

    const searchData = await searchRes.json();
    if (!searchData.files || searchData.files.length === 0) {
      return { success: true, found: false, message: 'Không tìm thấy file sao lưu "ledgerflow_backup.json" trên drive.' };
    }

    const fileId = searchData.files[0].id;

    // 2. Download media alt content
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const downloadRes = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!downloadRes.ok) {
      throw new Error(`Google Drive download failure with status ${downloadRes.status}`);
    }

    const payload = await downloadRes.json();
    
    // 3. Write into LocalStorage
    let count = 0;
    for (const key of SYNC_KEYS) {
      if (payload[key] !== undefined) {
        const val = payload[key];
        localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
        count++;
      }
    }

    return { 
      success: true, 
      found: true, 
      message: `Tìm thấy file sao lưu và nạp thành công ${count} phân hệ dữ liệu vào trình duyệt!` 
    };
  } catch (error) {
    console.error('Google Drive Restore Error:', error);
    throw error;
  }
}
