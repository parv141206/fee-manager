import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/auth";

const studentSchema = z.object({
  enrollmentNumber: z.string().min(1),
  name: z.string().min(1),
  branch: z.string().min(1), // <-- ADD THIS
  semester: z.number().int().min(1).max(8), // <-- ADD THIS
});

const uploadSchema = z.array(studentSchema);

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await request.json();
  const parsed = uploadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await prisma.$transaction(
    parsed.data.map((student) =>
      prisma.student.upsert({
        where: { enrollmentNumber: student.enrollmentNumber },
        update: {
          name: student.name,
          branch: student.branch,
          semester: student.semester,
        },
        create: student,
      })
    )
  );

  return NextResponse.json({ count: result.length });
}
