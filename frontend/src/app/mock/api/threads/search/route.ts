export const dynamic = "force-static";

// 静态数据，用于静态导出
const mockThreads = [
  {
    thread_id: "21cfea46-34bd-4aa6-9e1f-3009452fbeb9",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    title: "Doraemon Comic"
  },
  {
    thread_id: "3823e443-4e2b-4679-b496-a9506eae462b",
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    title: "Fei Fei Li Podcast"
  },
  {
    thread_id: "4f3e55ee-f853-43db-bfb3-7d1a411f03cb",
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z",
    title: "Darcy Proposal"
  }
];

// 仅在开发环境使用 fs
let fs: any;
let path: any;
try {
  fs = require("fs");
  path = require("path");
} catch (e) {
  // 在静态导出时，fs 不可用
}

type ThreadSearchRequest = {
  limit?: number;
  offset?: number;
  sortBy?: "updated_at" | "created_at";
  sortOrder?: "asc" | "desc";
};

type MockThreadSearchResult = Record<string, unknown> & {
  thread_id: string;
  updated_at: string | undefined;
};

export async function POST(request: Request) {
  const body = ((await request.json().catch(() => ({}))) ??
    {}) as ThreadSearchRequest;

  const rawLimit = body.limit;
  let limit = 50;
  if (typeof rawLimit === "number") {
    const normalizedLimit = Math.max(0, Math.floor(rawLimit));
    if (!Number.isNaN(normalizedLimit)) {
      limit = normalizedLimit;
    }
  }

  const rawOffset = body.offset;
  let offset = 0;
  if (typeof rawOffset === "number") {
    const normalizedOffset = Math.max(0, Math.floor(rawOffset));
    if (!Number.isNaN(normalizedOffset)) {
      offset = normalizedOffset;
    }
  }
  const sortBy = body.sortBy ?? "updated_at";
  const sortOrder = body.sortOrder ?? "desc";

  let threadData: MockThreadSearchResult[];

  // 检查是否可以使用 fs
  if (fs && path) {
    try {
      const threadsDir = fs.readdirSync(
        path.resolve(process.cwd(), "public/demo/threads"),
        {
          withFileTypes: true,
        },
      ) as any[];

      threadData = threadsDir
        .map((threadId): MockThreadSearchResult | null => {
          if (threadId.isDirectory() && !threadId.name.startsWith(".")) {
            try {
              const threadData = JSON.parse(
                fs.readFileSync(
                  path.resolve(`public/demo/threads/${threadId.name}/thread.json`),
                  "utf8",
                ),
              ) as Record<string, unknown>;

              return {
                ...threadData,
                thread_id: threadId.name,
                updated_at:
                  typeof threadData.updated_at === "string"
                    ? threadData.updated_at
                    : typeof threadData.created_at === "string"
                      ? threadData.created_at
                      : undefined,
              };
            } catch (e) {
              return null;
            }
          }
          return null;
        })
        .filter((thread): thread is MockThreadSearchResult => thread !== null);
    } catch (e) {
      // 如果读取文件失败，使用静态数据
      threadData = mockThreads;
    }
  } else {
    // 在静态导出时，使用静态数据
    threadData = mockThreads;
  }

  // 排序
  const sortedThreads = threadData.sort((a, b) => {
    const aTimestamp = a[sortBy];
    const bTimestamp = b[sortBy];
    const aParsed =
      typeof aTimestamp === "string" ? Date.parse(aTimestamp) : 0;
    const bParsed =
      typeof bTimestamp === "string" ? Date.parse(bTimestamp) : 0;
    const aValue = Number.isNaN(aParsed) ? 0 : aParsed;
    const bValue = Number.isNaN(bParsed) ? 0 : bParsed;
    return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
  });

  const pagedThreads = sortedThreads.slice(offset, offset + limit);
  return Response.json(pagedThreads);
}
