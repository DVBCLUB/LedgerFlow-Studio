import { Router } from 'express';
import { randomUUID } from 'node:crypto';

export const aiTaskBoardRoutes = Router();

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface AITask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string; // Tên nhân sự AI, VD: "AI Designer", "AI Marketer"
  createdAt: string;
}

// In-memory mock database
let aiTasks: AITask[] = [
  {
    id: randomUUID(),
    title: 'Phân tích Báo cáo tài chính Tháng 6',
    description: 'Đọc file báo cáo excel và xuất ra các chỉ số chính (Revenue, Profit Margin).',
    status: 'done',
    assignee: 'AI CFO',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: randomUUID(),
    title: 'Rà soát lỗi chính tả Landing Page',
    description: 'Duyệt toàn bộ nội dung HTML và sửa các lỗi ngữ pháp Tiếng Việt.',
    status: 'review',
    assignee: 'AI Reviewer',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: randomUUID(),
    title: 'Chạy chiến dịch Drip Email',
    description: 'Gửi 5 email cho danh sách lead thu thập được từ hôm qua.',
    status: 'in_progress',
    assignee: 'AI Marketer',
    createdAt: new Date().toISOString(),
  },
];

aiTaskBoardRoutes.get('/', (req, res) => {
  try {
    res.json({ success: true, tasks: aiTasks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

aiTaskBoardRoutes.post('/create', (req, res) => {
  try {
    const { title, description, assignee } = req.body;
    if (!title) throw new Error('Cần có tiêu đề công việc.');

    const newTask: AITask = {
      id: randomUUID(),
      title,
      description: description || '',
      status: 'todo',
      assignee: assignee || 'AI Agent',
      createdAt: new Date().toISOString(),
    };

    aiTasks.push(newTask);
    res.json({ success: true, task: newTask });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

aiTaskBoardRoutes.patch('/update-status', (req, res) => {
  try {
    const { id, status } = req.body;
    const task = aiTasks.find(t => t.id === id);
    if (!task) throw new Error('Không tìm thấy task.');
    
    // Simple validation
    const validStatuses = ['todo', 'in_progress', 'review', 'done'];
    if (!validStatuses.includes(status)) throw new Error('Trạng thái không hợp lệ.');

    task.status = status as TaskStatus;
    res.json({ success: true, task });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Route xóa task nếu cần dọn dẹp Kanban
aiTaskBoardRoutes.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    aiTasks = aiTasks.filter(t => t.id !== id);
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});
