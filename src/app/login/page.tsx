import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginSignupForm from "@/components/LoginSignupForm";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "ADMIN") {
      redirect("/admin");
    }

    redirect("/dashboard");
  }

  return <LoginSignupForm />;
}