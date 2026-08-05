"use client";

import { Bell } from "lucide-react";

import AlertItem from "./AlertItem";
import { OnboardingAlert } from "@/types/onboarding";

interface ActiveAlertsProps {
  alerts: OnboardingAlert[];
  onAlertClick?: (alert: OnboardingAlert) => void;
}

export default function ActiveAlerts({
  alerts,
  onAlertClick,
}: ActiveAlertsProps) {
  return (
   <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50">
              <Bell
                size={18}
                className="text-red-500"
              />
            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Active Alerts
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Monitor critical onboarding issues that require attention.
              </p>

            </div>

          </div>

        </div>

        {/* Notification Count */}

        <div className="flex h-11 items-center rounded-full bg-slate-100 px-4">

          <span className="text-sm font-semibold text-slate-700">
            {alerts.length}
          </span>

        </div>

      </div>

      {/* Cards */}

      <div className="mt-6 space-y-4">

        {alerts.map((alert) => (

          <AlertItem
            key={alert.id}
            alert={alert}
            onClick={onAlertClick}
          />

        ))}

      </div>

      {/* Footer */}

      <div className="mt-8 flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4">

        <div>

          <p className="font-medium text-slate-700">
            System reliability is our priority.
          </p>

          <p className="text-sm text-slate-500">
            We'll keep you updated with the latest onboarding alerts.
          </p>

        </div>

        <button
          className="
            rounded-xl
            bg-slate-900
            px-5
            py-3
            text-sm
            font-semibold
            text-white
            transition-all
            duration-300
            hover:bg-slate-800
          "
        >
          View All Alerts
        </button>

      </div>

    </section>
  );
}