"use client";

import { Student } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableRowActions } from "./data-table-row-actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface TableMeta {
  updateStudentInState: (student: Student) => void;
}

// --- THIS IS THE FUNCTION WE ARE CHANGING ---
const updateFeeStatus = async (
  student: Student,
  semester: keyof Student,
  isPaid: boolean,
  updateStudentInState: (student: Student) => void
) => {
  // --- OPTIMISTIC UI LOGIC ---
  // 1. Create a snapshot of the original student state, just in case we need to revert.
  const originalStudent = { ...student };

  // 2. Immediately update the local state. The UI will feel instant now.
  const optimisticallyUpdatedStudent = { ...student, [semester]: isPaid };
  updateStudentInState(optimisticallyUpdatedStudent);

  // 3. Perform the server request in the background.
  try {
    const response = await fetch(`/api/students/${student.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [semester]: isPaid }),
    });

    // 4. If the server request fails, revert the UI and show an error.
    if (!response.ok) {
      throw new Error("Update failed on the server.");
    }

    // If successful, we can show a success toast. The UI is already correct.
    toast.success(`${student.name}'s fee status updated.`);
  } catch (_err) {
    // --- REVERT ON FAILURE ---
    // 5. If there was any error, revert the UI back to its original state.
    toast.error(
      `Failed to update status for ${student.name}. Reverting change.`
    );
    updateStudentInState(originalStudent);
  }
};

// The rest of the file remains exactly the same.
export const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "enrollmentNumber",
    header: "Enrollment No.",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "branch",
    header: "Branch",
    cell: ({ row }) => <Badge variant="outline">{row.original.branch}</Badge>,
  },
  {
    accessorKey: "semester",
    header: "Sem",
  },
  {
    id: "feesPaid",
    header: "Fees Paid",
    accessorFn: (student) =>
      [
        student.sem1Paid,
        student.sem2Paid,
        student.sem3Paid,
        student.sem4Paid,
        student.sem5Paid,
        student.sem6Paid,
      ].filter(Boolean).length,
    cell: ({ row }) => {
      const paidCount = row.getValue("feesPaid") as number;
      return <div className="text-center">{paidCount} / 6</div>;
    },
  },
  ...([1, 2, 3, 4, 5, 6] as const).map(
    (sem): ColumnDef<Student> => ({
      id: `sem${sem}Paid`,
      header: `Sem ${sem}`,
      enableSorting: false,
      cell: ({ row, table }) => {
        const student = row.original;
        const semesterKey = `sem${sem}Paid` as const;
        const { updateStudentInState } = table.options.meta as TableMeta;
        return (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={student[semesterKey]}
              onCheckedChange={(value) => {
                if (updateStudentInState) {
                  updateFeeStatus(
                    student,
                    semesterKey,
                    !!value,
                    updateStudentInState
                  );
                }
              }}
              disabled={!updateStudentInState}
            />
          </div>
        );
      },
    })
  ),
  {
    id: "actions",
    enableSorting: false,
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
