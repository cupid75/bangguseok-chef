const json = (data, init = {}) => {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "bangguseok-chef",
        environment: "cloudflare-workers",
      });
    }

    return json(
      {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: "요청한 경로를 찾을 수 없습니다.",
        },
      },
      { status: 404 },
    );
  },
};
