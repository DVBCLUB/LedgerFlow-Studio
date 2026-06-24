import { inspectWebAIData } from "./webAiDataGuard.ts";
import { WebAiSessionManager, type WebAIProfile } from "./webAiSessionManager.ts";
import { executeWebAIAutomation, WebAIError } from "./webAiAutomator.ts";
import { callAIWithFallback } from "./aiRouter.ts";

export type TaskDomain = "coding" | "finance" | "marketing" | "sales" | "general";

export interface PlatformAdapterDetails {
  name: string;
  capabilities: string[];
  supportedTasks: TaskDomain[];
  health: "stable" | "unstable" | "down";
  selectorsVersion: string;
  privacyLevel: "normal" | "high";
  termsMode: "standard_terms" | "commercial_terms";
}

const PLATFORM_ADAPTERS: Record<string, PlatformAdapterDetails> = {
  chatgpt: {
    name: "ChatGPT",
    capabilities: ["Hội thoại tự nhiên", "Viết content & kịch bản", "Dịch thuật & giải thích bài viết"],
    supportedTasks: ["marketing", "sales", "general"],
    health: "stable",
    selectorsVersion: "v2.0.4",
    privacyLevel: "normal",
    termsMode: "standard_terms",
  },
  claude: {
    name: "Claude AI",
    capabilities: ["Lập trình thuật toán nâng cao", "Sửa lỗi code & logic", "Viết tài liệu hệ thống"],
    supportedTasks: ["coding", "general"],
    health: "stable",
    selectorsVersion: "v1.8.2",
    privacyLevel: "high",
    termsMode: "standard_terms",
  },
  gemini: {
    name: "Google Gemini",
    capabilities: ["Đồng bộ dữ liệu văn phòng", "Phân tích báo cáo tài chính", "Cửa sổ ngữ cảnh cực lớn"],
    supportedTasks: ["finance", "general"],
    health: "stable",
    selectorsVersion: "v1.4.1",
    privacyLevel: "high",
    termsMode: "commercial_terms",
  },
  deepseek: {
    name: "DeepSeek R1/V3",
    capabilities: ["Lập trình giá rẻ tối ưu", "Suy luận toán học", "Phân tích logic lập trình"],
    supportedTasks: ["coding", "finance", "general"],
    health: "stable",
    selectorsVersion: "v1.1.0",
    privacyLevel: "normal",
    termsMode: "standard_terms",
  },
  grok: {
    name: "xAI Grok",
    capabilities: ["Cập nhật tin tức X real-time", "Tra cứu nhanh", "Bảo mật thông tin"],
    supportedTasks: ["general"],
    health: "stable",
    selectorsVersion: "v1.0.2",
    privacyLevel: "normal",
    termsMode: "standard_terms",
  },
  copilot: {
    name: "Microsoft Copilot",
    capabilities: ["Tra cứu tài liệu Bing Search", "Tạo ảnh DALL-E", "Tóm tắt file Word/Excel"],
    supportedTasks: ["general"],
    health: "stable",
    selectorsVersion: "v1.2.0",
    privacyLevel: "high",
    termsMode: "standard_terms",
  },
};

const PLATFORM_SCORES: Record<string, Record<TaskDomain, number>> = {
  chatgpt: { coding: 7, finance: 7, marketing: 10, sales: 9, general: 8 },
  claude: { coding: 10, finance: 8, marketing: 7, sales: 7, general: 9 },
  gemini: { coding: 7, finance: 10, marketing: 8, sales: 8, general: 8 },
  deepseek: { coding: 9, finance: 9, marketing: 7, sales: 7, general: 8 },
  grok: { coding: 8, finance: 7, marketing: 8, sales: 7, general: 8 },
  copilot: { coding: 7, finance: 7, marketing: 7, sales: 7, general: 7 },
};

export class WebAiTaskRouter {
  /**
   * Classify task prompt using semantic LLM classification
   */
  public static async classifyTaskSemantic(prompt: string): Promise<TaskDomain> {
    const fallbackClassify = () => this.classifyTask(prompt);

    try {
      const messages = [
        {
          role: "system" as const,
          content: "You are an AI task classifier. Analyze the user request and classify it into exactly one of the following categories: 'coding', 'finance', 'marketing', 'sales', or 'general'. Answer with ONLY the single word representing the category. No punctuation, no explanation, no markdown formatting."
        },
        {
          role: "user" as const,
          content: prompt
        }
      ];

      // Call AI with a short timeout of 3000ms
      const aiPromise = callAIWithFallback(messages, {
        temperature: 0.1,
        maxTokens: 10,
        model: "ai-assistant"
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI Classification timeout")), 3000)
      );

      const result = await Promise.race([aiPromise, timeoutPromise]);
      const category = (result.content || "").trim().toLowerCase();

      const validDomains: TaskDomain[] = ["coding", "finance", "marketing", "sales", "general"];
      for (const domain of validDomains) {
        if (category.includes(domain)) {
          return domain;
        }
      }

      return fallbackClassify();
    } catch (error) {
      console.warn("[Web AI Task Router] Semantic classification failed, falling back to keywords:", error);
      return fallbackClassify();
    }
  }

  /**
   * Classify task prompt to appropriate domain (Synchronous keyword fallback)
   */
  public static classifyTask(prompt: string): TaskDomain {
    const text = prompt.toLowerCase();
    
    const codingKeywords = ["code", "function", "bug", "error", "class", "react", "html", "css", "ts", "js", "python", "lập trình", "sửa lỗi", "thuật toán"];
    const financeKeywords = ["accounting", "finance", "vas", "ledgers", "tax", "sổ sách", "báo cáo tài chính", "chi phí", "thuế", "doanh thu", "invoice", "hóa đơn", "kế toán"];
    const marketingKeywords = ["video", "tiktok", "youtube", "script", "marketing", "content", "kịch bản", "post", "quảng cáo", "viết bài", "growth", "chiến dịch"];
    const salesKeywords = ["crm", "lead", "customer", "proposal", "khách hàng", "hợp đồng", "báo giá", "bán hàng", "chăm sóc khách"];

    if (codingKeywords.some(kw => text.includes(kw))) return "coding";
    if (financeKeywords.some(kw => text.includes(kw))) return "finance";
    if (marketingKeywords.some(kw => text.includes(kw))) return "marketing";
    if (salesKeywords.some(kw => text.includes(kw))) return "sales";
    
    return "general";
  }

  /**
   * Analyze prompt and recommend optimal platforms and profiles
   */
  public static async recommend(prompt: string): Promise<{
    taskDomain: TaskDomain;
    privacyScan: ReturnType<typeof inspectWebAIData>;
    recommendations: Array<{
      platform: string;
      displayName: string;
      score: number;
      isRecommended: boolean;
      profiles: WebAIProfile[];
      details: PlatformAdapterDetails;
    }>;
  }> {
    const domain = await this.classifyTaskSemantic(prompt);
    const privacy = inspectWebAIData(prompt);
    const allProfiles = await WebAiSessionManager.listProfiles();
    
    const recommendations = Object.keys(PLATFORM_SCORES).map((platform) => {
      const score = PLATFORM_SCORES[platform][domain];
      const details = PLATFORM_ADAPTERS[platform];
      const profiles = allProfiles.filter(p => p.platform === platform && p.enabled);
      
      return {
        platform,
        displayName: details.name,
        score,
        isRecommended: false,
        profiles,
        details,
      };
    });

    // Sort by capability score descending
    recommendations.sort((a, b) => b.score - a.score);
    if (recommendations.length > 0) {
      recommendations[0].isRecommended = true;
    }

    return {
      taskDomain: domain,
      privacyScan: privacy,
      recommendations,
    };
  }

  /**
   * Propose a fallback profile if current profile fails or hits quota
   */
  public static async getFallbackProfile(failedProfileId: string, platform: string): Promise<WebAIProfile | null> {
    const candidates = await WebAiSessionManager.listAvailableProfiles(platform, failedProfileId);
    // Find first ready profile that is not the failed one
    const fallback = candidates.find(c => c.id !== failedProfileId && c.status !== "quota");
    return fallback || null;
  }
}
