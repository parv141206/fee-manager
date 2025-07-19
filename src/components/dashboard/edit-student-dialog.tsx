"use client";

import { Student } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface EditStudentDialogProps {
  student: Student;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function EditStudentDialog({
  student,
  isOpen,
  setIsOpen,
}: EditStudentDialogProps) {
  // State to manage the form inputs
  const [name, setName] = useState(student.name);
  const [enrollmentNumber, setEnrollmentNumber] = useState(
    student.enrollmentNumber
  );
  const [branch, setBranch] = useState(student.branch); // <-- ADD
  const [semester, setSemester] = useState(String(student.semester));
  // Effect to reset form state when a different student is selected
  // or when the dialog is reopened.
  useEffect(() => {
    if (isOpen) {
      setName(student.name);
      setEnrollmentNumber(student.enrollmentNumber);
    }
  }, [isOpen, student]);

  const handleSubmit = async () => {
    // Basic validation
    if (!name.trim() || !enrollmentNumber.trim()) {
      toast.error("Name and Enrollment Number cannot be empty.");
      return;
    }

    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          enrollmentNumber,
          branch,
          semester: parseInt(semester), // <-- ADD
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Check for unique constraint error from the database
        if (errorData.error?.meta?.target?.includes("enrollmentNumber")) {
          throw new Error(
            "This enrollment number is already in use by another student."
          );
        }
        throw new Error("Failed to update student. Please try again.");
      }

      toast.success("Student updated successfully.");
      setIsOpen(false);

      // This is a simple way to refresh the data on the page.
      // In a more complex app, you might use a state management library
      // like React Query or SWR to refetch data without a full page reload.
      window.location.reload();
    } catch (_error) {
      if (_error instanceof Error) {
        toast.error(_error.message);
      } else {
        toast.error("An unknown error occurred while updating the student.");
      }
      console.error(_error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Make changes to the student's profile here. Click save when you're
            done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="enrollment" className="text-right">
              Enrollment No.
            </Label>
            <Input
              id="enrollment"
              value={enrollmentNumber}
              onChange={(e) => setEnrollmentNumber(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
