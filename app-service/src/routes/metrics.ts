import express, { NextFunction, Request, Response } from "express";
import client from "prom-client";

const router = express.Router();

client.collectDefaultMetrics();

const httpRequestsTotal = new client.Counter({
	name: "app_service_http_requests_total",
	help: "Total number of HTTP requests received by app-service",
	labelNames: ["method", "route", "status_code"] as const,
});

const httpRequestDurationSeconds = new client.Histogram({
	name: "app_service_http_request_duration_seconds",
	help: "Duration of HTTP requests in seconds",
	labelNames: ["method", "route", "status_code"] as const,
	buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
});

const getRouteLabel = (req: Request): string => {
	if (req.route?.path) {
		return req.baseUrl ? `${req.baseUrl}${req.route.path}` : req.route.path;
	}

	const requestPath = req.originalUrl.split("?")[0] || req.path || "unknown";

	return requestPath
		.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, ":id")
		.replace(/\b[0-9a-f]{24}\b/gi, ":id")
		.replace(/\/\d+(?=\/|$)/g, "/:id");
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
	if (req.originalUrl.startsWith("/metrics")) {
		next();
		return;
	}

	const endTimer = httpRequestDurationSeconds.startTimer();

	res.on("finish", () => {
		const route = getRouteLabel(req);
		const labels = {
			method: req.method,
			route,
			status_code: String(res.statusCode),
		};

		httpRequestsTotal.inc(labels);
		endTimer(labels);
	});

	next();
};

router.get("/", async (_req: Request, res: Response) => {
	res.set("Content-Type", client.register.contentType);
	res.end(await client.register.metrics());
});

export { router as metricsRouter };

