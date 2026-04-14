export const dynamic = "force-static";

// 静态数据，用于静态导出
const mockThreadHistory = {
  "21cfea46-34bd-4aa6-9e1f-3009452fbeb9": {
    history: [
      {
        role: "user",
        content: "Tell me about Doraemon"
      },
      {
        role: "assistant",
        content: "Doraemon is a Japanese manga series..."
      }
    ]
  },
  "3823e443-4e2b-4679-b496-a9506eae462b": {
    history: [
      {
        role: "user",
        content: "Tell me about Fei Fei Li"
      },
      {
        role: "assistant",
        content: "Fei Fei Li is a computer scientist..."
      }
    ]
  },
  "4f3e55ee-f853-43db-bfb3-7d1a411f03cb": {
    history: [
      {
        role: "user",
        content: "Tell me about Darcy's proposal"
      },
      {
        role: "assistant",
        content: "Darcy's proposal is from Pride and Prejudice..."
      }
    ]
  }
};

// 仅在开发环境使用 fs
let fs: any;
let path: any;
try {
  fs = require("fs");
  path = require("path");
} catch (e) {
  // 在静态导出时，fs 不可用
}

import type { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ thread_id: string }> },
) {
  const threadId = (await params).thread_id;

  // 检查是否可以使用 fs
  if (fs && path) {
    try {
      const jsonString = fs.readFileSync(
        path.resolve(process.cwd(), `public/demo/threads/${threadId}/thread.json`),
        "utf8",
      );
      const json = JSON.parse(jsonString);
      if (Array.isArray(json.history)) {
        return Response.json(json);
      }
      return Response.json([json]);
    } catch (e) {
      // 如果读取文件失败，使用静态数据
      const mockData = mockThreadHistory[threadId as keyof typeof mockThreadHistory];
      if (mockData) {
        return Response.json(mockData);
      }
      return Response.json({ history: [] });
    }
  } else {
    // 在静态导出时，使用静态数据
    const mockData = mockThreadHistory[threadId as keyof typeof mockThreadHistory];
    if (mockData) {
      return Response.json(mockData);
    }
    return Response.json({ history: [] });
  }
}

export function generateStaticParams() {
  // 生成一些默认的静态参数
  return Object.keys(mockThreadHistory).map(threadId => ({
    thread_id: threadId
  }));
}
