import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineArrowRight,
} from "react-icons/hi2";
import Logo from "@/components/common/Logo";
import Button from "@/components/common/Button";
import { validators } from "@/utils/validators";
import useAuthStore from "@/store/useAuthStore";
import { authService } from "@/services/authService";
import { fadeInUp, staggerContainer } from "@/animations/variants";
import { forwardRef } from "react";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    setServerError("");

    if (isRegister && !acceptedTerms) {
      setServerError(
        "Please accept the Terms of Service and Privacy Policy to continue.",
      );
      return;
    }

    try {
      let response;
      if (isRegister) {
        response = await authService.register(data);
      } else {
        response = await authService.login(data);
      }

      storeLogin(response.data.user, response.data.token);
      navigate("/dashboard");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";
      setServerError(message);
    }
  };

  const toggleMode = () => {
    setIsRegister((prev) => !prev);
    setServerError("");
    setAcceptedTerms(false);
    reset();
  };

  return (
    <>
      <Helmet>
        <title>{isRegister ? "Create Account" : "Login"} | IGAutomates</title>
      </Helmet>

      <div className="min-h-screen flex relative overflow-hidden">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-dark relative items-center justify-center p-12">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary-mid/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-primary-light/8 rounded-full blur-[100px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 max-w-md"
          >
            <div className="mb-8">
              <Logo variant="light" size="large" />
            </div>

            <h2 className="text-3xl font-manrope font-bold text-white mb-4">
              Automate Instagram DMs
            </h2>
            <p className="text-base text-white/50 font-jakarta leading-relaxed mb-8">
              Connect your Instagram Business account, select posts, set
              keywords, and let IGAutomates automatically send DMs when users
              comment.
            </p>

            <div className="space-y-3">
              {[
                { step: "01", label: "Connect Instagram" },
                { step: "02", label: "Choose a post" },
                { step: "03", label: "Set keyword + DM" },
                { step: "04", label: "Get leads automatically" },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10"
                >
                  <span className="text-sm font-manrope font-bold text-primary-light">
                    {item.step}
                  </span>
                  <span className="text-sm text-white/70 font-jakarta">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white overflow-y-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md py-8"
          >
            <div className="lg:hidden mb-8">
              <Logo size="large" />
            </div>

            <motion.div variants={fadeInUp}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isRegister ? "register" : "login"}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-2xl md:text-3xl font-manrope font-bold text-primary-darkest mb-2">
                    {isRegister ? "Create your account" : "Welcome back"}
                  </h1>
                  <p className="text-sm text-text-muted font-jakarta mb-8">
                    {isRegister
                      ? "Start automating your Instagram DMs."
                      : "Log in to manage your automations."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200"
              >
                <p className="text-sm text-red-600 font-jakarta">
                  {serverError}
                </p>
              </motion.div>
            )}

            <motion.form
              variants={fadeInUp}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <AnimatePresence mode="wait">
                {isRegister && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <LoginField
                      label="Full Name"
                      icon={<HiOutlineUser className="w-5 h-5" />}
                      error={errors.name?.message}
                      placeholder="John Doe"
                      {...register("name", {
                        validate: isRegister ? validators.required : undefined,
                      })}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <LoginField
                label="Email Address"
                type="email"
                icon={<HiOutlineEnvelope className="w-5 h-5" />}
                error={errors.email?.message}
                placeholder="you@example.com"
                {...register("email", { validate: validators.email })}
              />

              <div className="relative">
                <LoginField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  icon={<HiOutlineLockClosed className="w-5 h-5" />}
                  error={errors.password?.message}
                  placeholder={
                    isRegister ? "Min 8 characters" : "Enter password"
                  }
                  {...register("password", { validate: validators.password })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-[2.65rem] text-text-muted hover:text-primary-dark transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <HiOutlineEyeSlash className="w-5 h-5" />
                  ) : (
                    <HiOutlineEye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <AnimatePresence>
                {isRegister && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <label className="flex items-start gap-3 p-4 rounded-xl bg-surface-cream border border-border-light cursor-pointer hover:border-primary-mid transition-colors">
                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-border-light text-primary-dark focus:ring-2 focus:ring-primary-mid/20 cursor-pointer"
                      />
                      <span className="text-xs font-jakarta text-text-primary leading-relaxed">
                        I agree to IGAutomates&apos;s{" "}
                        <Link
                          to="/terms"
                          target="_blank"
                          className="text-primary-dark font-semibold hover:underline"
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          to="/privacy-policy"
                          target="_blank"
                          className="text-primary-dark font-semibold hover:underline"
                        >
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                variant="primary"
                size="large"
                className="w-full justify-center"
                loading={isSubmitting}
                icon={<HiOutlineArrowRight />}
              >
                {isRegister ? "Create Account" : "Log In"}
              </Button>
            </motion.form>

            <motion.div variants={fadeInUp} className="mt-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-border-light" />
                <span className="text-xs text-text-muted font-jakarta uppercase tracking-wider">
                  or
                </span>
                <div className="flex-1 h-px bg-border-light" />
              </div>

              <button
                onClick={toggleMode}
                type="button"
                className="w-full py-3.5 rounded-2xl border border-border-light text-sm font-jakarta font-semibold text-primary-darkest hover:bg-primary-lightest/20 hover:border-primary-mid transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-mid/20"
              >
                {isRegister
                  ? "Already have an account? Log in"
                  : "Don't have an account? Create one"}
              </button>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-8 pt-6 border-t border-border-light"
            >
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link
                  to="/privacy-policy"
                  className="text-xs text-text-muted hover:text-primary-dark font-jakarta font-medium transition-colors"
                >
                  Privacy Policy
                </Link>
                <span className="text-text-muted/40">·</span>
                <Link
                  to="/terms"
                  className="text-xs text-text-muted hover:text-primary-dark font-jakarta font-medium transition-colors"
                >
                  Terms of Service
                </Link>
                <span className="text-text-muted/40">·</span>
                <Link
                  to="/data-deletion"
                  className="text-xs text-text-muted hover:text-primary-dark font-jakarta font-medium transition-colors"
                >
                  Data Deletion
                </Link>
              </div>

              <p className="mt-4 text-center text-[10px] text-text-muted/60 font-jakarta">
                © 2026 IGAutomates. All rights reserved.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

const LoginField = forwardRef(function LoginField(
  { label, type = "text", icon, error, ...props },
  ref,
) {
  return (
    <div>
      <label className="block text-xs font-jakarta font-semibold text-primary-darkest mb-2 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full py-3.5 rounded-xl bg-surface-cream border text-sm font-jakarta text-primary-darkest placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary-mid/20 focus:bg-white transition-all duration-300 ${
            icon ? "pl-12 pr-4" : "px-4"
          } ${
            error
              ? "border-red-400 focus:border-red-400"
              : "border-border-light focus:border-primary-mid"
          }`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 font-jakarta">{error}</p>
      )}
    </div>
  );
});
