"use client";

import { TriangleAlert } from "lucide-react";

interface DeleteModalProps {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteModal({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: DeleteModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <TriangleAlert
              className="text-red-600"
              size={40}
            />
          </div>
        </div>

<h2 className="mt-5 text-center text-2xl font-bold">
  {title}
</h2>

<p className="mt-2 text-center text-gray-500">
  {description}
</p>
        <div className="mt-8 flex justify-end gap-3">

          <button
            onClick={onCancel}
            className="rounded-lg border px-5 py-2 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"
          >
            Delete
          </button>

        </div>

      </div>
    </div>
  );
}