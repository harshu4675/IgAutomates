import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { HiOutlineUser, HiOutlineCheckCircle } from "react-icons/hi2";
import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardNav from "@/components/dashboard/DashboardNav";
import Button from "@/components/common/Button";
import Avatar from "@/components/common/Avatar";
import useUIStore from "@/store/useUIStore";
import useAuthStore from "@/store/useAuthStore";
import { validators } from "@/utils/validators";

export default function Settings() {
  const { isSidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { name: user?.name || "", email: user?.email || "" },
  });

  const onSubmit = (data) => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <>
      <Helmet>
        <title>Settings | InstaFlow</title>
      </Helmet>

      <div className="min-h-screen bg-surface-cream">
        <Sidebar />
        <DashboardNav title="Settings" subtitle="Manage your account" />
        <motion.main
          animate={{ marginLeft: isSidebarOpen ? 260 : 80 }}
          transition={{ duration: 0.3 }}
          className="p-6 md:p-8 max-w-3xl"
        >
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3"
            >
              <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500" />
              <p className="text-sm text-emerald-700 font-jakarta">
                Settings saved.
              </p>
            </motion.div>
          )}

          <div className="bg-white rounded-3xl border border-border-light shadow-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-cta flex items-center justify-center">
                <HiOutlineUser className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-manrope font-bold text-primary-darkest">
                Profile Information
              </h2>
            </div>

            <div className="flex items-center gap-5 mb-8 pb-8 border-b border-border-light">
              <Avatar name={user?.name || "User"} size="xl" />
              <div>
                <p className="text-sm font-manrope font-bold text-primary-darkest">
                  {user?.name}
                </p>
                <p className="text-xs text-text-muted font-jakarta">
                  {user?.email}
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5 max-w-lg"
            >
              <div>
                <label className="block text-xs font-jakarta font-semibold text-primary-darkest mb-2 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  className={`w-full px-4 py-3.5 rounded-xl bg-surface-cream border text-sm font-jakarta text-primary-darkest focus:outline-none focus:border-primary-mid focus:ring-2 focus:ring-primary-mid/20 transition-all ${
                    errors.name ? "border-red-400" : "border-border-light"
                  }`}
                  {...register("name", { validate: validators.required })}
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-500 font-jakarta">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-jakarta font-semibold text-primary-darkest mb-2 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  className="w-full px-4 py-3.5 rounded-xl bg-primary-lightest/20 border border-border-light text-sm font-jakarta text-text-muted cursor-not-allowed"
                  {...register("email")}
                />
                <p className="mt-1.5 text-xs text-text-muted font-jakarta">
                  Email cannot be changed
                </p>
              </div>

              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </form>
          </div>
        </motion.main>
      </div>
    </>
  );
}
