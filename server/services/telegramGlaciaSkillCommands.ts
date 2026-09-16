/**
 * telegramGlaciaSkillCommands.ts
 * Commands: /skills, /run-skill, /b2b-scrape, /vas-export
 */

type SendMessageFn = (chatId: number, text: string, opts?: any) => Promise<void>;

export async function tryHandleGlaciaSkillCommand(
  chatId: number,
  text: string,
  sendMessage: SendMessageFn
): Promise<boolean> {
  const lower = text.trim().toLowerCase();

  // /skills
  if (lower === '/skills' || lower === '/skills@bot') {
    try {
      const { listGlaciaSkills } = await import('./glaciaSkillCompiler.ts');
      const skills = listGlaciaSkills();
      const lines = [
        '🤖 *Glacia Skills - $0 Token Local Runtime*',
        '',
      ];
      for (const s of skills) {
        lines.push('• `' + s.id + '` - *' + s.name + '*');
        lines.push('  ' + s.category + ' | ' + s.runtime + ' | Da chay: ' + s.executionCount + ' lan');
        lines.push('');
      }
      lines.push('Dung `/run-skill <id>` de chay.');
      lines.push('Dung `/b2b-scrape <dia diem> <nganh>` de scrape leads nhanh.');
      lines.push('Dung `/vas-export` de xuat bao cao tai chinh VAS.');
      await sendMessage(chatId, lines.join('\n'), { parse_mode: 'Markdown' });
      return true;
    } catch (err: any) {
      await sendMessage(chatId, 'Loi tai danh sach skills: ' + err.message);
      return true;
    }
  }

  // /run-skill <id>
  if (lower.startsWith('/run-skill')) {
    const parts = text.trim().split(/\s+/);
    const skillId = parts[1];
    if (!skillId) {
      await sendMessage(chatId, 'Vui long chi dinh skill ID. VD: `/run-skill skill-scrape-b2b-leads`');
      return true;
    }
    try {
      await sendMessage(chatId, 'Dang thuc thi skill `' + skillId + '`...');
      const { executeGlaciaSkill } = await import('./glaciaSkillCompiler.ts');
      const result = await executeGlaciaSkill(skillId);
      const output = result.output.length > 3000
        ? result.output.slice(0, 3000) + '\n\n... (truncated)'
        : result.output;
      const msg = (result.success ? 'THANH CONG' : 'THAT BAI') +
        '\nThoi gian: ' + result.durationMs + 'ms | Tokens saved: ' + result.tokensSaved +
        '\n\n```\n' + output + '\n```';
      await sendMessage(chatId, msg, { parse_mode: 'Markdown' });
      return true;
    } catch (err: any) {
      await sendMessage(chatId, 'Loi thuc thi skill: ' + err.message);
      return true;
    }
  }

  // /b2b-scrape <query>
  if (lower.startsWith('/b2b-scrape')) {
    const query = text.trim().replace(/^\/b2b-scrape(@bot)?\s*/i, '');
    if (!query) {
      await sendMessage(chatId, 'Vui long nhap dia diem va nganh. VD: `/b2b-scrape Ha Noi nha hang`');
      return true;
    }
    try {
      await sendMessage(chatId, 'Dang scrape B2B leads: "' + query + '"...');
      const { executeGlaciaSkill } = await import('./glaciaSkillCompiler.ts');
      const result = await executeGlaciaSkill('skill-scrape-b2b-leads', { query });
      const summary = result.output.length > 2000
        ? result.output.slice(0, 2000) + '\n\n... (truncated)'
        : result.output;
      const msg = '*B2B Lead Scraping hoan tat*\n\n```\n' + summary + '\n```' +
        '\n\nThoi gian: ' + result.durationMs + 'ms | Tiet kiem: ~$' + (result.tokensSaved * 0.002).toFixed(2);
      await sendMessage(chatId, msg, { parse_mode: 'Markdown' });
      return true;
    } catch (err: any) {
      await sendMessage(chatId, 'Loi B2B scraping: ' + err.message);
      return true;
    }
  }

  // /vas-export
  if (lower === '/vas-export' || lower === '/vas-export@bot') {
    try {
      await sendMessage(chatId, 'Dang xuat bao cao tai chinh VAS ra Excel...');
      const { executeGlaciaSkill } = await import('./glaciaSkillCompiler.ts');
      const result = await executeGlaciaSkill('skill-export-vas-financial-statement');
      const output = result.output.length > 2000
        ? result.output.slice(0, 2000) + '\n\n...'
        : result.output;
      const msg = (result.success ? 'THANH CONG' : 'THAT BAI') +
        '\n\n' + output +
        '\n\nThoi gian: ' + result.durationMs + 'ms | File: VAS_Financial_Statement.xlsx';
      await sendMessage(chatId, msg, { parse_mode: 'Markdown' });
      return true;
    } catch (err: any) {
      await sendMessage(chatId, 'Loi VAS export: ' + err.message);
      return true;
    }
  }

  // /briefing or /morning
  if (lower === '/briefing' || lower === '/morning' || lower === '/briefing@bot') {
    try {
      const { getLatestMorningBriefing } = await import('./glaciaNightShiftAutopilot.ts');
      const briefing = getLatestMorningBriefing();
      await sendMessage(chatId, `🤖 *Bản Tin Điều Hành Glacia CEO:*\n\n${briefing}\n\n_Hệ thống sẵn sàng phục vụ CEO David Bao._`, { parse_mode: 'Markdown' });
      return true;
    } catch (err: any) {
      await sendMessage(chatId, 'Lỗi lấy bản tin điều hành: ' + err.message);
      return true;
    }
  }

  // /night
  if (lower === '/night' || lower === '/night@bot') {
    try {
      await sendMessage(chatId, '🌙 *Đang kích hoạt chế độ Tự Lái Ca Đêm (Night Shift Autopilot)...*');
      const { startNightShiftAutopilot } = await import('./glaciaNightShiftAutopilot.ts');
      const session = await startNightShiftAutopilot();
      const msg = `🌙 *Ca Trực Đêm Glacia Hoàn Tất*\n\n• Tác vụ hoàn thành: ${session.tasksCompleted}/${session.tasks.length}\n• Điểm sức khỏe hệ thống: ${session.systemHealthScore}/100\n• Thời gian: ${new Date(session.startedAt).toLocaleTimeString()} -> ${new Date(session.endedAt || '').toLocaleTimeString()}\n\n_${session.morningHandoffBriefing}_`;
      await sendMessage(chatId, msg, { parse_mode: 'Markdown' });
      return true;
    } catch (err: any) {
      await sendMessage(chatId, 'Lỗi kích hoạt ca đêm: ' + err.message);
      return true;
    }
  }

  // /goals
  if (lower === '/goals' || lower === '/goals@bot') {
    try {
      const { getGoalPlans } = await import('./glaciaGoalDecomposer.ts');
      const goals = getGoalPlans();
      if (goals.length === 0) {
        await sendMessage(chatId, '🎯 Chưa có mục tiêu chiến lược nào trong hệ thống. Hãy tạo trên Desktop hoặc dùng câu lệnh tự nhiên.');
        return true;
      }
      const lines = ['🎯 *Danh Sách Mục Tiêu Chiến Lược (DAG):*', ''];
      for (const g of goals.slice(0, 5)) {
        lines.push(`• *${g.title}*`);
        lines.push(`  Tiến độ: ${g.progressPercentage}% | ${g.tasks.length} bước | Trạng thái: ${g.status.toUpperCase()}`);
      }
      await sendMessage(chatId, lines.join('\n'), { parse_mode: 'Markdown' });
      return true;
    } catch (err: any) {
      await sendMessage(chatId, 'Lỗi lấy danh sách mục tiêu: ' + err.message);
      return true;
    }
  }

  // /whatif <scenario>
  if (lower.startsWith('/whatif')) {
    const scenarioQuery = text.trim().replace(/^\/whatif(@bot)?\s*/i, '');
    if (!scenarioQuery) {
      await sendMessage(chatId, 'Vui lòng nhập kịch bản mô phỏng. VD: `/whatif Tang gia 20% va giam churn`');
      return true;
    }
    try {
      const { runWhatIfScenario } = await import('./glaciaDigitalTwin.ts');
      const res = runWhatIfScenario({ name: scenarioQuery, priceDeltaPercent: 15, churnDeltaPercent: 1 });
      const msg = `🧬 *Mô Phỏng Digital Twin — What-If Simulator*\n\n*Kịch bản:* ${res.scenarioName}\n• Tác động doanh thu: ${res.projectedRevenueChangePercent > 0 ? '+' : ''}${res.projectedRevenueChangePercent}%\n• Tác động lợi nhuận: ${res.projectedProfitDeltaPercent > 0 ? '+' : ''}${res.projectedProfitDeltaPercent}%\n• Mức độ rủi ro: ${res.riskLevel.toUpperCase()}\n\n*Khuyến nghị:* ${res.keyInsights[0]}`;
      await sendMessage(chatId, msg, { parse_mode: 'Markdown' });
      return true;
    } catch (err: any) {
      await sendMessage(chatId, 'Lỗi mô phỏng Digital Twin: ' + err.message);
      return true;
    }
  }

  return false;
}
