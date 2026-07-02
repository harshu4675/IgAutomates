import { motion } from "framer-motion";
import {
  HiOutlineCheckBadge,
  HiOutlineTrash,
  HiOutlineArrowTopRightOnSquare,
} from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useDisconnectInstagram } from "@/hooks/useInstagram";
import { formatNumber } from "@/utils/formatNumber";

export default function InstagramAccountCard({ account }) {
  const disconnectMutation = useDisconnectInstagram();
  const navigate = useNavigate();

  const handleDisconnect = () => {
    if (
      confirm(
        `Disconnect @${account.igUsername}? All campaigns for this account will stop working.`,
      )
    ) {
      disconnectMutation.mutate(account._id);
    }
  };

  const handleCreateCampaign = () => {
    navigate("/campaigns", { state: { accountId: account._id } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-border-light shadow-card overflow-hidden"
    >
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 h-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
      </div>

      <div className="px-6 pb-6 -mt-12 relative">
        <div className="flex items-end justify-between mb-4">
          <div className="w-24 h-24 rounded-2xl border-4 border-white bg-white shadow-lg overflow-hidden">
            {account.profilePicture ? (
              <img
                src={account.profilePicture}
                alt={account.igUsername}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-light to-primary-mid flex items-center justify-center text-white text-2xl font-manrope font-bold">
                {account.igUsername.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold font-jakarta text-emerald-700">
              <HiOutlineCheckBadge className="w-3.5 h-3.5" />
              Connected
            </span>
          </div>
        </div>

        <div className="mb-5">
          <h3 className="text-lg font-manrope font-bold text-primary-darkest">
            @{account.igUsername}
          </h3>
          {account.igName && (
            <p className="text-sm text-text-muted font-jakarta">
              {account.igName}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5 pb-5 border-b border-border-light">
          <div>
            <p className="text-xl font-manrope font-extrabold text-primary-darkest">
              {formatNumber(account.followersCount)}
            </p>
            <p className="text-[10px] text-text-muted font-jakarta uppercase tracking-wider">
              Followers
            </p>
          </div>
          <div>
            <p className="text-xl font-manrope font-extrabold text-primary-darkest">
              {formatNumber(account.mediaCount)}
            </p>
            <p className="text-[10px] text-text-muted font-jakarta uppercase tracking-wider">
              Posts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateCampaign}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-cta text-white text-sm font-jakarta font-semibold shadow-button hover:shadow-button-hover transition-all duration-300"
          >
            <HiOutlineArrowTopRightOnSquare className="w-4 h-4" />
            Create Campaign
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnectMutation.isPending}
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 transition-colors disabled:opacity-50"
            aria-label="Disconnect"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
