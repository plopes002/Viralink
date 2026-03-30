// src/components/StatCard.tsx
"use client";

type Props = {
  label: string;
  value: string | number;
  helper?: string;
};

export function StatCard({ label, value, helper }: Props) {
  return (
    <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4 flex flex-col gap-1">
      <p className="text-[11px] text-[#9CA3AF]">{label}</p>

      <p className="text-2xl font-semibold text-white">
        {value}
      </p>

      {helper && (
        <p className="text-[11px] text-[#9CA3AF]">
          {helper}
        </p>
      )}
    </div>
  );
}