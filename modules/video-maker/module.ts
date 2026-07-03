/**
 * modules/video-maker/module.ts
 * Video Maker Module — Bản demo của dynamic module được nạp tự động.
 */
import type { IModule } from '../../core/types/module.interface.js';

const VideoMakerModule: IModule = {
  meta: {
    id: 'video-maker',
    name: 'Video Creator Studio',
    version: '1.0.0',
    description: 'Sản xuất video marketing và AI voiceover tự động.',
    enabled: true,
    category: 'creative',
    nav: {
      id: 'video-maker',
      label: 'Video AI',
      icon: 'Video', // Khớp với Video icon từ Lucide
      path: '/video-maker',
      order: 70,
    },
  },

  async onInit() {
    console.log('[Video Maker] Dynamic module auto-started successfully!');
  },

  registerRoutes(app) {
    // 1. Trạng thái chung
    app.get('/api/video-maker/status', (_req, res) => {
      res.json({ success: true, status: 'ready', engine: 'FFmpeg/Runway-Hybrid-Daemon' });
    });

    // 2. Danh sách Connectors
    app.get('/api/video-maker/connectors', (_req, res) => {
      res.json({
        success: true,
        connectors: [
          { id: 'midjourney', label: 'Midjourney v6 API', type: 'image', status: 'connected', latencyMs: 120 },
          { id: 'runway', label: 'Runway Gen-3 Alpha', type: 'video', status: 'connected', latencyMs: 180 },
          { id: 'elevenlabs', label: 'ElevenLabs Speech v2', type: 'audio', status: 'connected', latencyMs: 95 },
          { id: 'sora', label: 'OpenAI Sora API', type: 'video', status: 'maintenance', latencyMs: null }
        ]
      });
    });

    // 3. Danh sách tác phẩm video đã tạo
    const mockGallery = [
      {
        id: 'vid-01',
        title: 'Giới thiệu LedgerFlow Studio (Phim 3D)',
        prompt: 'Giới thiệu không gian làm việc số và hệ sinh thái phần mềm tự trị dành cho doanh nghiệp...',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-pattern-flowing-44474-large.mp4',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'vid-02',
        title: 'Chiến dịch Marketing Đội ngũ AI',
        prompt: 'Tạo clip hoạt họa ngắn giới thiệu robot tự động hóa gửi duyệt qua Telegram...',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-matrix-style-falling-green-numbers-41589-large.mp4',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
      }
    ];

    app.get('/api/video-maker/gallery', (_req, res) => {
      res.json({ success: true, gallery: mockGallery });
    });

    // 4. Kích hoạt render video (Giả lập FFmpeg / Cloud API)
    app.post('/api/video-maker/generate', (req, res) => {
      const { prompt, title } = req.body;
      if (!prompt) {
        return res.status(400).json({ success: false, error: 'Vui lòng cung cấp prompt hoặc ý tưởng kịch bản.' });
      }

      const newVideo = {
        id: `vid-${Date.now()}`,
        title: title || `Tác phẩm AI #${mockGallery.length + 1}`,
        prompt,
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-41712-large.mp4',
        createdAt: new Date().toISOString()
      };

      // Đẩy vào đầu danh sách
      mockGallery.unshift(newVideo);

      res.json({
        success: true,
        message: 'Đã hoàn thành render video bằng kết nối Hybrid.',
        video: newVideo
      });
    });
  }
};

export default VideoMakerModule;
