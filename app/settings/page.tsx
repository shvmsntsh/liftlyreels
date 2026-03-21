"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Volume2, VolumeX, User, Lock, Mail, ChevronRight } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { BottomNav } from "@/components/BottomNav";
import clsx from "clsx";

type Section = "profile" | "account" | "audio";

function SectionButton({
  icon,
  label,
  desc,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition",
        active
          ? "border-[var(--accent)]/40 bg-[var(--accent-soft)]"
          : "border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]"
      )}
    >
      <div className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
        active ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "bg-[var(--surface-2)] text-muted"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted shrink-0" />
    </button>
  );
}

function SaveButton({ saving, saved, onClick, disabled }: { saving: boolean; saved: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || saving}
      className={clsx(
        "mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition",
        saving || disabled
          ? "bg-[var(--surface-2)] text-muted"
          : "bg-[var(--accent)] text-[var(--on-accent)] hover:brightness-110"
      )}
    >
      {saving ? (
        <motion.div
          className="h-4 w-4 rounded-full border-2 border-[var(--on-accent)] border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
        />
      ) : saved ? (
        <><Check className="h-4 w-4" /> Saved</>
      ) : (
        "Save Changes"
      )}
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>("profile");

  // Profile
  const [bio, setBio] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Account
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);
  const [accountError, setAccountError] = useState("");

  // Audio
  const [audioEnabled, setAudioEnabled] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("display_name,bio")
        .eq("id", user.id)
        .single();

      if (data) {
        setBio(data.bio ?? "");
        setDisplayName(data.display_name ?? "");
      }
    }
    loadProfile();

    const stored = localStorage.getItem("liftly_audio");
    setAudioEnabled(stored !== "off");
  }, [router]);

  async function saveProfile() {
    setProfileSaving(true);
    setProfileError("");
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, display_name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error ?? "Failed to save");
      } else {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 2500);
      }
    } catch {
      setProfileError("Network error. Try again.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function saveAccount() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setAccountSaving(true);
    setAccountError("");

    try {
      const updates: { email?: string; password?: string } = {};

      if (email.trim()) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email !== email.trim()) updates.email = email.trim();
      }

      if (newPassword) {
        if (newPassword.length < 8) {
          setAccountError("Password must be at least 8 characters.");
          return;
        }
        if (newPassword !== confirmPassword) {
          setAccountError("Passwords don't match.");
          return;
        }
        updates.password = newPassword;
      }

      if (Object.keys(updates).length === 0) {
        setAccountError("Nothing to update.");
        return;
      }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) {
        setAccountError(error.message);
      } else {
        setAccountSaved(true);
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setAccountSaved(false), 2500);
      }
    } finally {
      setAccountSaving(false);
    }
  }

  function toggleAudio() {
    const next = !audioEnabled;
    setAudioEnabled(next);
    localStorage.setItem("liftly_audio", next ? "on" : "off");
    window.dispatchEvent(new CustomEvent("liftly_audio_change", { detail: next }));
  }

  return (
    <main className="relative min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-xl">
        <div className="mx-auto max-w-md px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-2)]"
            >
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Settings</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-4 px-4 pt-4">
        {/* Section nav */}
        <div className="space-y-2">
          <SectionButton
            icon={<User className="h-4 w-4" />}
            label="Profile"
            desc="Bio and display name"
            active={section === "profile"}
            onClick={() => setSection("profile")}
          />
          <SectionButton
            icon={<Lock className="h-4 w-4" />}
            label="Account"
            desc="Email and password"
            active={section === "account"}
            onClick={() => setSection("account")}
          />
          <SectionButton
            icon={audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            label="Audio"
            desc={audioEnabled ? "Background music on" : "Background music off"}
            active={section === "audio"}
            onClick={() => setSection("audio")}
          />
        </div>

        {/* Profile section */}
        {section === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 space-y-4"
          >
            <h2 className="text-sm font-bold text-foreground">Edit Profile</h2>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                placeholder="Your display name"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-[var(--accent)]/40"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">
                Bio
                <span className="ml-1 font-normal text-muted/60">({bio.length}/200)</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                maxLength={200}
                rows={3}
                placeholder="Tell people what you're about..."
                className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-[var(--accent)]/40"
              />
            </div>

            {profileError && (
              <p className="text-xs text-red-400">{profileError}</p>
            )}

            <SaveButton
              saving={profileSaving}
              saved={profileSaved}
              onClick={saveProfile}
            />
          </motion.div>
        )}

        {/* Account section */}
        {section === "account" && (
          <motion.div
            key="account"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 space-y-4"
          >
            <h2 className="text-sm font-bold text-foreground">Account Settings</h2>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-[var(--accent)]/40"
              />
              <p className="mt-1 text-[11px] text-muted">
                A confirmation email will be sent to your new address.
              </p>
            </div>

            <div className="border-t border-[var(--border)] pt-4">
              <p className="mb-3 text-xs font-bold text-foreground">Change Password</p>
              <div className="space-y-3">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 8 chars)"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-[var(--accent)]/40"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-[var(--accent)]/40"
                />
              </div>
            </div>

            {accountError && (
              <p className="text-xs text-red-400">{accountError}</p>
            )}

            <SaveButton
              saving={accountSaving}
              saved={accountSaved}
              onClick={saveAccount}
            />
          </motion.div>
        )}

        {/* Audio section */}
        {section === "audio" && (
          <motion.div
            key="audio"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4"
          >
            <h2 className="mb-3 text-sm font-bold text-foreground">Audio Preferences</h2>
            <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3">
              <div className="flex items-center gap-3">
                {audioEnabled ? (
                  <Volume2 className="h-5 w-5 text-[var(--accent)]" />
                ) : (
                  <VolumeX className="h-5 w-5 text-muted" />
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">Background Music</p>
                  <p className="text-xs text-muted">
                    {audioEnabled ? "Plays ambient music per category" : "Silent mode"}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleAudio}
                className={clsx(
                  "relative h-6 w-11 rounded-full transition-colors duration-200",
                  audioEnabled ? "bg-[var(--accent)]" : "bg-[var(--surface-3)]"
                )}
              >
                <div
                  className={clsx(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
                    audioEnabled ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
            <p className="mt-3 text-xs text-muted">
              Each category plays a matching ambient loop (Mindset, Gym, Books, etc.). Disable this for a fully silent experience.
            </p>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
