import { Router } from "expo-router";

export type RouteArg = string | { pathname: string; params?: Record<string, any> };

export function push(router: any, route: RouteArg) {
  return router.push(route as any);
}

export function replace(router: any, route: RouteArg) {
  return router.replace(route as any);
}

export function back(router: any) {
  return router.back();
}
