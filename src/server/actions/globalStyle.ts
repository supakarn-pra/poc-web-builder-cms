"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export interface GlobalStyleState {
  error?: string;
  saved?: boolean;
}

const schema = z.object({
  websiteId: z.string().min(1),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "สีไม่ถูกต้อง"),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "สีไม่ถูกต้อง"),
  logoUrl: z.string().url("URL ไม่ถูกต้อง").or(z.literal("")),
  headingFont: z.enum(["sans", "serif", "display"]),
  bodyFont: z.enum(["sans", "serif"]),
  buttonStyle: z.enum(["solid", "outline", "ghost"]),
  radius: z.enum(["none", "sm", "md", "lg"]),
});

export async function updateGlobalStyle(
  _prev: GlobalStyleState,
  formData: FormData,
): Promise<GlobalStyleState> {
  const user = await requireUser();

  const parsed = schema.safeParse({
    websiteId: formData.get("websiteId"),
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    logoUrl: formData.get("logoUrl") ?? "",
    headingFont: formData.get("headingFont"),
    bodyFont: formData.get("bodyFont"),
    buttonStyle: formData.get("buttonStyle"),
    radius: formData.get("radius"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const website = await db.website.findUnique({
    where: { id: parsed.data.websiteId },
    select: { ownerId: true },
  });
  if (!website || (website.ownerId !== user.id && user.role !== "ADMIN")) {
    return { error: "ไม่พบเว็บไซต์" };
  }

  const { websiteId, logoUrl, ...style } = parsed.data;
  await db.website.update({
    where: { id: websiteId },
    data: {
      globalStyle: JSON.stringify({
        ...style,
        logoUrl: logoUrl || undefined,
      }),
    },
  });

  revalidatePath("/administrator/settings");
  return { saved: true };
}
