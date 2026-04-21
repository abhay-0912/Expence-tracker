import { getDashboardData } from "./dashboardData.js";
import { renderDashboard } from "./renderDashboard.js";

export function buildDashboardHtml(env = process.env) {
  return renderDashboard(getDashboardData(env));
}