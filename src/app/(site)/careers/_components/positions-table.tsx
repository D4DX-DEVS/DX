"use client";

import { ArrowRight, Briefcase } from "@/components/icons";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApplicationForm } from "./application-form";

export interface PositionRow {
  id: string;
  title: string;
  level: string;
  experience: string;
}

const GENERAL = "General application";

/**
 * The open positions as a table (Position, Level, Experience, Apply Now), newest first as the admin set them.
 * Apply Now opens the application form in a popup with that position already chosen.
 */
export function PositionsTable({ jobs }: { jobs: PositionRow[] }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState("");
  const positions = [...jobs.map((j) => j.title), GENERAL];

  const apply = (title: string) => {
    setPosition(title);
    setOpen(true);
  };

  return (
    <>
      {jobs.length ? (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-white/15 bg-white/[0.03] md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-white/15 bg-white/[0.04] text-sm font-semibold text-white/85">
                  <th scope="col" className="px-6 py-4">Position</th>
                  <th scope="col" className="px-6 py-4">Level</th>
                  <th scope="col" className="px-6 py-4">Experience</th>
                  <th scope="col" className="w-48 px-6 py-4">
                    <span className="sr-only">Apply</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j, i) => (
                  <tr key={j.id} className="feed-in group border-b border-white/10 transition-colors last:border-0 hover:bg-white/[0.05]" style={{ animationDelay: `${i * 70}ms` }}>
                    <th scope="row" className="px-6 py-5 text-[1.0625rem] font-semibold">{j.title}</th>
                    <td className="px-6 py-5 text-white/80">{j.level || "-"}</td>
                    <td className="px-6 py-5 text-white/80">{j.experience || "-"}</td>
                    <td className="px-6 py-3 text-right">
                      <button type="button" onClick={() => apply(j.title)} className="btn btn-brand min-h-11 px-5 text-[0.9375rem]">
                        Apply Now
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="flex flex-col gap-3 md:hidden">
            {jobs.map((j, i) => (
              <li key={j.id} className="feed-in rounded-2xl border border-white/15 bg-white/[0.04] p-5" style={{ animationDelay: `${i * 70}ms` }}>
                <h3 className="text-lg font-semibold">{j.title}</h3>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-white/55">Level</dt>
                    <dd className="mt-0.5 font-medium">{j.level || "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-white/55">Experience</dt>
                    <dd className="mt-0.5 font-medium">{j.experience || "-"}</dd>
                  </div>
                </dl>
                <button type="button" onClick={() => apply(j.title)} className="btn btn-brand mt-5 w-full">
                  Apply Now
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/20 p-10 text-center">
          <Briefcase className="mx-auto size-8 text-white/55" aria-hidden="true" />
          <p className="mt-4 font-semibold">No open positions right now.</p>
          <p className="mt-2 text-white/70">We still read every application. Send yours and we will keep it on file.</p>
          <button type="button" onClick={() => apply(GENERAL)} className="btn btn-brand mt-6">
            Send an application
          </button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="theme-light max-h-[92svh] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-3xl" aria-describedby="apply-description">
          <DialogHeader className="border-b border-border px-6 py-4 pr-14">
            <DialogTitle className="text-xl font-semibold tracking-[-0.01em]">Application Form</DialogTitle>
            <DialogDescription id="apply-description" className="sr-only">
              Your details and résumé for the position you are applying for.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto overscroll-contain">
            {open ? <ApplicationForm key={position} positions={positions} initialPosition={position} onClose={() => setOpen(false)} /> : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
