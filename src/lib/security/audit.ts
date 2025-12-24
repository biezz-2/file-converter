import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export enum AuditAction {
    LOGIN = "LOGIN",
    LOGOUT = "LOGOUT",
    CONVERSION_START = "CONVERSION_START",
    CONVERSION_COMPLETE = "CONVERSION_COMPLETE",
    CONVERSION_FAILED = "CONVERSION_FAILED",
    DOWNLOAD_START = "DOWNLOAD_START",
    DOWNLOAD_COMPLETE = "DOWNLOAD_COMPLETE",
    API_KEY_CREATED = "API_KEY_CREATED",
}

export async function logAudit(userId: string, action: AuditAction, details?: Record<string, any>) {
    try {
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || "unknown";
        const userAgent = headersList.get("user-agent") || "unknown";

        // In a real enterprise app, we might have a dedicated AuditLog table.
        // For now, we'll log to console or a structured log service, 
        // and potentially store critical stats in UsageStats.

        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: "INFO",
            type: "AUDIT",
            userId,
            ip,
            userAgent,
            action,
            details
        }));

        // Example: Update usage stats if it's a conversion or download
        if (action === AuditAction.CONVERSION_COMPLETE) {
            await prisma.usageStats.upsert({
                where: { userId_date: { userId, date: new Date() } }, // Note: Date matching logic needs to be day-generic in real app
                create: { userId, conversions: 1 },
                update: { conversions: { increment: 1 } }
            });
        }

    } catch (error) {
        console.error("Failed to log audit", error);
    }
}
