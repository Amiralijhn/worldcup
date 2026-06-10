import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AppNavbar from "@/components/AppNavbar";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        <AppNavbar
          name={user.displayName}
          role={user.role}
        />

        <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl sm:p-8">
          <p className="font-bold text-green-300">
            Account Security
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Change Password
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/60">
            Enter your current password and choose a new password. You will be
            logged out after the password is changed.
          </p>

          <ChangePasswordForm />
        </section>
      </div>
    </main>
  );
}