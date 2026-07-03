import { Router } from 'express';
import { getSupportedAIProviders, getAIVaultSecurityStatus } from './aiKeyVault.ts';
import { generateContent } from './contentStudioAI.ts';
import { randomUUID } from 'node:crypto';

export const videoMakerRoutes = Router();

// In-memory mock cho gallery (nếu cần persist có thể ghi vào file JSON)
const gallery: any[] = [];

videoMakerRoutes.get('/connectors', async (req, res) => {
  try {
    const vaultStatus = await getAIVaultSecurityStatus();
    const providers = getSupportedAIProviders();
    
    // Lọc ra các provider multi-modal
    const mediaProviders = ['runway', 'luma', 'leonardo', 'elevenlabs', 'replicate'];
    const connectors = providers
      .filter(p => mediaProviders.includes(p.id))
      .map(p => ({
        id: p.id,
        label: p.label,
        type: 'Hybrid Cloud',
        status: vaultStatus.isLocked ? 'maintenance' : 'connected',
        latencyMs: vaultStatus.isLocked ? null : Math.floor(Math.random() * 50) + 20, // Mock latency
      }));

    res.json({ success: true, connectors });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

videoMakerRoutes.get('/gallery', (req, res) => {
  // Trả về danh sách xếp mới nhất lên đầu
  res.json({ success: true, gallery: [...gallery].reverse() });
});

videoMakerRoutes.post('/generate', async (req, res) => {
  try {
    const { prompt, title } = req.body;
    if (!prompt) throw new Error('Yêu cầu truyền prompt.');

    // Gọi Content Studio để sinh kịch bản chi tiết dựa trên prompt
    // Chúng ta gửi qua hàm sinh kịch bản video/3D
    const scriptAsset = await generateContent({
      type: 'video_script',
      topic: prompt,
      tone: 'professional',
    });

    const newVideo = {
      id: randomUUID(),
      title: title || 'Tác phẩm không tên',
      prompt: prompt,
      // Ở bản MVP, chúng ta sinh ra kịch bản và mock video url (dùng video sample)
      // Trong thực tế, đây là lúc gọi API của Runway/Luma bằng kịch bản nhận được từ scriptAsset.
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', 
      scriptDetail: scriptAsset.content,
      createdAt: new Date().toISOString(),
    };

    gallery.push(newVideo);

    res.json({
      success: true,
      message: 'Video đã được sinh thành công (Simulated). Kịch bản đã lưu!',
      video: newVideo,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
