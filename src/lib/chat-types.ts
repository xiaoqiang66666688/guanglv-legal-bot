export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: "doubao-seed-2-1-turbo-260628",
    name: "豆包 Seed 2.1 Turbo",
    description: "最新旗舰 Turbo 模型，极速响应，更强能力",
  },
  {
    id: "doubao-seed-2-0-pro-260215",
    name: "豆包 Seed 2.0 Pro",
    description: "旗舰级全能通用模型，复杂推理与长链路任务",
  },
  {
    id: "doubao-seed-2-0-lite-260215",
    name: "豆包 Seed 2.0 Lite",
    description: "均衡型模型，性能与成本兼顾",
  },
  {
    id: "doubao-seed-2-0-mini-260215",
    name: "豆包 Seed 2.0 Mini",
    description: "低时延高并发，快速响应",
  },
  {
    id: "doubao-seed-1-8-251228",
    name: "豆包 Seed 1.8",
    description: "多模态 Agent 场景优化模型",
  },
  {
    id: "glm-4-7-251222",
    name: "GLM-4.7",
    description: "智谱旗舰模型，强编程能力",
  },
];
