export const dynamic = "force-static";

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

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      thread_id: string;
      artifact_path?: string[] | undefined;
    }>;
  },
) {
  const threadId = (await params).thread_id;
  let artifactPath = (await params).artifact_path?.join("/") ?? "";

  // 检查是否可以使用 fs
  if (fs && path) {
    if (artifactPath.startsWith("mnt/")) {
      artifactPath = path.resolve(
        process.cwd(),
        artifactPath.replace("mnt/", `public/demo/threads/${threadId}/`),
      );
      if (fs.existsSync(artifactPath)) {
        if (request.nextUrl.searchParams.get("download") === "true") {
          // Attach the file to the response
          const headers = new Headers();
          headers.set(
            "Content-Disposition",
            `attachment; filename="${artifactPath}"`,
          );
          return new Response(fs.readFileSync(artifactPath), {
            status: 200,
            headers,
          });
        }
        if (artifactPath.endsWith(".mp4")) {
          return new Response(fs.readFileSync(artifactPath), {
            status: 200,
            headers: {
              "Content-Type": "video/mp4",
            },
          });
        }
        return new Response(fs.readFileSync(artifactPath), { status: 200 });
      }
    }
  }
  // 在静态导出时，返回 404
  return new Response("File not found", { status: 404 });
}

export function generateStaticParams() {
  // 生成一些默认的静态参数
  return [
    { thread_id: "21cfea46-34bd-4aa6-9e1f-3009452fbeb9", artifact_path: [] },
    { thread_id: "3823e443-4e2b-4679-b496-a9506eae462b", artifact_path: [] },
    { thread_id: "4f3e55ee-f853-43db-bfb3-7d1a411f03cb", artifact_path: [] }
  ];
}
