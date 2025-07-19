"use client";

import { useEffect, useState, useMemo, ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { Student } from "@prisma/client";
import { columns } from "@/components/dashboard/columns";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { handleSignOut } from "../actions";

type StudentExcelData = {
  "Enrollment Number": string;
  Name: string;
  Branch: string;
  Semester: number;
};

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedSemester, setSelectedSemester] = useState("All");

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/students");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setStudents(data);
    } catch (_error) {
      toast.error("Could not load student data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // REAL-TIME UPDATE FUNCTION
  const updateStudentInState = (updatedStudent: Student) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.id === updatedStudent.id ? updatedStudent : student
      )
    );
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<StudentExcelData>(worksheet);

      const formattedData = json.map((item) => ({
        enrollmentNumber: String(item["Enrollment Number"]),
        name: item.Name,
        branch: item.Branch,
        semester: Number(item.Semester),
      }));

      try {
        const response = await fetch("/api/students/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formattedData),
        });
        if (!response.ok) throw new Error("Upload failed");
        const result = await response.json();
        toast.success(
          `${result.count} students uploaded/updated successfully!`
        );
        fetchStudents();
      } catch (_error) {
        toast.error("An error occurred during upload.");
      }
    };
    reader.readAsBinaryString(file);
    event.target.value = ""; // Reset file input
  };

  const handleRedoUpload = async () => {
    try {
      await fetch("/api/students", { method: "DELETE" });
      toast.success("All student data cleared.");
      setStudents([]); // Clear state immediately
    } catch (_error) {
      toast.error("Failed to clear student data.");
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const searchMatch = student.enrollmentNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const branchMatch =
        selectedBranch === "All" || student.branch === selectedBranch;
      const semesterMatch =
        selectedSemester === "All" ||
        student.semester === parseInt(selectedSemester);
      return searchMatch && branchMatch && semesterMatch;
    });
  }, [students, searchTerm, selectedBranch, selectedSemester]);

  const branches = useMemo(
    () => ["All", ...new Set(students.map((s) => s.branch))],
    [students]
  );
  const semesters = useMemo(
    () => ["All", ...new Set(students.map((s) => String(s.semester)))].sort(),
    [students]
  );

  return (
    <div className="container mx-auto py-10">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Student Fee Dashboard</h1>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/users">
            <Button variant="outline">Manage Users</Button>
          </Link>
          <form action={handleSignOut}>
            <Button type="submit">Sign Out</Button>
          </form>
        </div>
      </header>

      <div className="mb-6 p-4 border rounded-lg bg-card">
        <h2 className="font-semibold mb-2">Upload & Manage Data</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Upload an Excel file with 'Enrollment Number', 'Name', 'Branch', and
          'Semester' columns.
        </p>
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            className="flex-1"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete All & Redo</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all student records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRedoUpload}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Yes, delete all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="mb-4 p-4 border rounded-lg bg-card">
        <h2 className="font-semibold mb-2">Filter & Search</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search by Enrollment Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredStudents}
          meta={{ updateStudentInState }}
        />
      )}
    </div>
  );
}
