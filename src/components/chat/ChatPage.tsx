"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Settings, Trash2, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ChatMessage, ModelOption } from "@/lib/chat-types";
import { AVAILABLE_MODELS } from "@/lib/chat-types";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/default-prompt";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    "doubao-seed-2-1-turbo-260628"
  );
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 自动调整 textarea 高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      },
    ]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
          temperature,
          systemPrompt: systemPrompt || undefined,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("请求失败");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法获取响应流");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setIsLoading(false);
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + parsed.content }
                      : msg
                  )
                );
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: `抱歉，发生了错误：${(error as Error).message}`,
                }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selectedModel);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      {/* 侧边栏 */}
      <aside className="hidden md:flex md:w-72 lg:w-80 flex-col border-r border-slate-800 bg-slate-900/50">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-base">广律在线</h1>
              <p className="text-xs text-slate-400">法律咨询助手</p>
            </div>
          </div>
          <Button
            onClick={clearChat}
            variant="outline"
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            新建对话
          </Button>
        </div>

        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* 模型选择 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-300">
              选择模型
            </Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                <SelectValue placeholder="选择模型" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                {AVAILABLE_MODELS.map((model: ModelOption) => (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                    className="hover:bg-slate-700"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{model.name}</span>
                      <span className="text-xs text-slate-400">
                        {model.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 温度设置 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium text-slate-300">
                创造力 (Temperature)
              </Label>
              <Badge
                variant="outline"
                className="border-slate-700 text-slate-400"
              >
                {temperature.toFixed(1)}
              </Badge>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={(value) => setTemperature(value[0])}
              min={0}
              max={2}
              step={0.1}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>精确</span>
              <span>创意</span>
            </div>
          </div>

          {/* 系统提示词 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-300">
              系统提示词
            </Label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="定义 AI 的角色和行为..."
              className="w-full min-h-[120px] px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg resize-none text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">
            Powered by 火山方舟 · 豆包大模型
          </p>
        </div>
      </aside>

      {/* 主聊天区域 */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/30 backdrop-blur-sm flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="bg-slate-900 border-slate-800 text-slate-100"
              >
                <SheetHeader>
                  <SheetTitle className="text-slate-100">设置</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-300">
                      选择模型
                    </Label>
                    <Select
                      value={selectedModel}
                      onValueChange={setSelectedModel}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                        <SelectValue placeholder="选择模型" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                        {AVAILABLE_MODELS.map((model: ModelOption) => (
                          <SelectItem
                            key={model.id}
                            value={model.id}
                            className="hover:bg-slate-700"
                          >
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium text-slate-300">
                        创造力
                      </Label>
                      <Badge
                        variant="outline"
                        className="border-slate-700 text-slate-400"
                      >
                        {temperature.toFixed(1)}
                      </Badge>
                    </div>
                    <Slider
                      value={[temperature]}
                      onValueChange={(value) => setTemperature(value[0])}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-300">
                      系统提示词
                    </Label>
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="定义 AI 的角色和行为..."
                      className="w-full min-h-[120px] px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg resize-none text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div>
              <h2 className="font-medium text-sm">
                {currentModel?.name || "选择模型"}
              </h2>
              <p className="text-xs text-slate-500">
                {currentModel?.description}
              </p>
            </div>
          </div>
          <Button
            onClick={clearChat}
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
            title="清空对话"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </header>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold mb-2 bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                你好，我是广律在线
              </h2>
              <p className="text-slate-400 text-center max-w-md mb-8">
                专业法律咨询助手，为您提供免费初步法律分析。
                有什么法律问题需要帮助吗？
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  {
                    title: "公司拖欠工资怎么办",
                    desc: "劳动纠纷维权指引",
                  },
                  {
                    title: "对方欠钱不还",
                    desc: "债务追讨方案",
                  },
                  {
                    title: "想离婚财产怎么分",
                    desc: "婚姻家事咨询",
                  },
                  {
                    title: "交通事故怎么索赔",
                    desc: "赔偿项目与流程",
                  },
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(item.title)}
                    className="p-4 text-left rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 hover:border-slate-700 transition-all"
                  >
                    <div className="font-medium text-sm text-slate-200">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="border-t border-slate-800 bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-slate-800/80 rounded-2xl border border-slate-700 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你的问题..."
                className="flex-1 bg-transparent border-0 resize-none px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus-visible:ring-0 min-h-[48px] max-h-[200px]"
                rows={1}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="m-2 h-9 w-9 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-center text-xs text-slate-600 mt-2">
              按 Enter 发送，Shift + Enter 换行
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-gradient-to-br from-indigo-500 to-violet-600"
            : "bg-slate-800 border border-slate-700"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-indigo-400" />
        )}
      </div>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-sm"
            : "bg-slate-800/80 text-slate-100 border border-slate-700/50 rounded-tl-sm"
        }`}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content || (
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
