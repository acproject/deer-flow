import { type NextRequest } from "next/server";

import { env } from "@/env";

function getGatewayBaseURL(): string {
  return env.NEXT_PUBLIC_BACKEND_BASE_URL ?? "http://localhost:8001";
}

function getLangGraphBaseURL(): string {
  return env.NEXT_PUBLIC_LANGGRAPH_BASE_URL ?? "http://localhost:2024";
}

function joinUrl(base: string, pathname: string): string {
  return `${base.replace(/\/+$/, "")}/${pathname.replace(/^\/+/, "")}`;
}

async function proxyRequest(request: Request, targetUrl: string): Promise<Response> {
  const srcUrl = new URL(request.url);
  const dstUrl = new URL(targetUrl);
  dstUrl.search = srcUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    body: request.body,
    redirect: "manual",
    duplex: "half",
  };

  if (request.method === "GET" || request.method === "HEAD") {
    delete init.body;
    delete init.duplex;
  }

  const upstream = await fetch(dstUrl, init);

  const respHeaders = new Headers(upstream.headers);
  respHeaders.delete("content-encoding");
  respHeaders.delete("content-length");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  });
}

type RouteParams = { path?: string[] };

async function handle(request: Request, paramsPromise: Promise<RouteParams>): Promise<Response> {
  const params = await paramsPromise;
  const segments = params.path ?? [];
  if (segments.length === 0) return new Response(null, { status: 404 });

  if (segments[0] === "langgraph") {
    const targetPath = segments.slice(1).join("/");
    return proxyRequest(request, joinUrl(getLangGraphBaseURL(), targetPath));
  }

  const targetPath = ["api", ...segments].join("/");
  return proxyRequest(request, joinUrl(getGatewayBaseURL(), targetPath));
}

export function GET(request: NextRequest, context: { params: Promise<RouteParams> }): Promise<Response> {
  return handle(request, context.params);
}

export function POST(request: NextRequest, context: { params: Promise<RouteParams> }): Promise<Response> {
  return handle(request, context.params);
}

export function PUT(request: NextRequest, context: { params: Promise<RouteParams> }): Promise<Response> {
  return handle(request, context.params);
}

export function PATCH(request: NextRequest, context: { params: Promise<RouteParams> }): Promise<Response> {
  return handle(request, context.params);
}

export function DELETE(request: NextRequest, context: { params: Promise<RouteParams> }): Promise<Response> {
  return handle(request, context.params);
}

export function OPTIONS(request: NextRequest, context: { params: Promise<RouteParams> }): Promise<Response> {
  return handle(request, context.params);
}
