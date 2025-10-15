"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import PasswordInput from "@/components/PasswordInput";
import { showError, showSuccess } from "@/lib/toast";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  title: string;
  createdAt: string;
}

const SettingsPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setUser(data.user);
      setRole(data.user?.role?.toLowerCase() || "");
    } catch (error) {
      showError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (data: any) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change password");
      }

      reset();
      setIsChangingPassword(false);
      showSuccess("Password changed successfully");
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    reset();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading settings...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Failed to load settings</div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

        {/* Account Information Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Account Information
          </h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Name:</span>
                <p className="text-gray-800">
                  {user.title &&
                    user.title.charAt(0).toUpperCase() +
                      user.title.slice(1)}{" "}
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <p className="text-gray-800">{user.email}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Role:</span>
                <p className="text-gray-800 capitalize">{role}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Member since:</span>
                <p className="text-gray-800">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Security</h2>

          {!isChangingPassword ? (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">Password</h3>
                  <p className="text-sm text-gray-600">
                    Last updated: Recently
                  </p>
                </div>
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Change Password
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(handleChangePassword)}
              className="space-y-4"
            >
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-800 mb-4">
                  Change Password
                </h3>

                <PasswordInput
                  name="currentPassword"
                  label="Current Password"
                  placeholder="Enter your current password"
                  register={register}
                  rules={{ required: "Current password is required" }}
                  errors={errors}
                />

                <PasswordInput
                  name="newPassword"
                  label="New Password"
                  placeholder="Enter your new password"
                  register={register}
                  rules={{
                    required: "New password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters long",
                    },
                    validate: (value: string) =>
                      /^(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/.test(
                        value
                      ) || "Password must contain at least one symbol",
                  }}
                  errors={errors}
                />

                <PasswordInput
                  name="confirmPassword"
                  label="Confirm New Password"
                  placeholder="Confirm your new password"
                  register={register}
                  rules={{
                    required: "Confirm password is required",
                    validate: (value: string) =>
                      value === newPassword || "Passwords do not match",
                  }}
                  errors={errors}
                />

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelPasswordChange}
                    className="px-6 py-2 bg-gray-400 text-black rounded-md hover:bg-gray-300 transition-colors"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Preferences Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Preferences
          </h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">
                    Email Notifications
                  </h3>
                  <p className="text-sm text-gray-600">
                    Receive email updates about your account
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-red-600 mb-4">
            Danger Zone
          </h2>
          <div className="bg-red-50 p-4 rounded-md border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-800">Delete Account</h3>
                <p className="text-sm text-red-600">
                  Permanently delete your account and all data
                </p>
              </div>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
