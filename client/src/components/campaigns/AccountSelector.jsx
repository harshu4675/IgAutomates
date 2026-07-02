import { motion } from "framer-motion";
import { HiOutlineCheckCircle } from "react-icons/hi2";
import { formatNumber } from "@/utils/formatNumber";

export default function AccountSelector({ accounts, selectedId, onSelect }) {
  return (
    <div>
      <h3 className="text-lg font-manrope font-bold text-primary-darkest mb-2">
        Select Instagram Account
      </h3>
      <p className="text-sm text-text-muted font-jakarta mb-6">
        Choose which Instagram account this campaign will run on.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {accounts.map((account) => {
          const isSelected = selectedId === account._id;

          return (
            <motion.button
              key={account._id}
              type="button"
              onClick={() => onSelect(account._id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                isSelected
                  ? "border-primary-dark bg-primary-lightest/20 shadow-card"
                  : "border-border-light bg-white hover:border-primary-mid"
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <HiOutlineCheckCircle className="w-5 h-5 text-primary-dark" />
                </div>
              )}

              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500">
                {account.profilePicture ? (
                  <img
                    src={account.profilePicture}
                    alt={account.igUsername}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-manrope font-bold">
                    {account.igUsername.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-manrope font-bold text-primary-darkest truncate">
                  @{account.igUsername}
                </p>
                <p className="text-xs text-text-muted font-jakarta">
                  {formatNumber(account.followersCount)} followers ·{" "}
                  {formatNumber(account.mediaCount)} posts
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
