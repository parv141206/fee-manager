import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const students = await prisma.student.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(students);
}

// Used for the "Redo Upload" functionality
export async function DELETE() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.student.deleteMany({});
  return NextResponse.json({ message: "All students deleted" });
}
