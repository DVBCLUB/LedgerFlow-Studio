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
    app.get('/api/video-maker/status', (_req, res) => {
      res.json({ success: true, status: 'ready', engine: 'FFmpeg/Synthesia-Mock' });
    });
  }
};

export default VideoMakerModule;
