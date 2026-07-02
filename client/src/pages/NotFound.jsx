import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import Button from "@/components/common/Button";
import { HiOutlineArrowLeft } from "react-icons/hi2";

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>404 | InstaFlow</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-surface-cream">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-6"
        >
          <h1 className="text-8xl font-manrope font-extrabold text-gradient mb-4">
            404
          </h1>
          <h2 className="text-2xl font-manrope font-bold text-primary-darkest mb-4">
            Page Not Found
          </h2>
          <p className="text-sm text-text-muted font-jakarta mb-8 max-w-md mx-auto">
            This page does not exist. Go back to your dashboard.
          </p>
          <Link to="/dashboard">
            <Button
              variant="primary"
              icon={<HiOutlineArrowLeft />}
              iconPosition="left"
            >
              Back to Dashboard
            </Button>
          </Link>
        </motion.div>
      </div>
    </>
  );
}
