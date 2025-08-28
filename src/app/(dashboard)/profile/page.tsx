"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import AuthenticationInput from "@/components/AuthenticationInput";
import DropSelect from "@/components/DropSelect";
import { showError, showSuccess } from "@/lib/toast";
import { paths } from "@/lib/paths";

const titleOptions = [
  { label: "Mr", value: "mr" },
  { label: "Mrs", value: "mrs" },
  { label: "Miss", value: "miss" },
  { label: "Dr", value: "dr" },
  { label: "Prof", value: "prof" },
];

const roleOptions = [
  { label: "Admin", value: "admin" },
  { label: "Lecturer", value: "lecturer" },
  { label: "Student", value: "student" },
];

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  title: string;
  role: string;
  createdAt: string;
}

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    reset,
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      title: "",
      role: "",
    },
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setUser(data.user);

      // Set form values
      setValue("firstName", data.user.firstName);
      setValue("lastName", data.user.lastName);
      setValue("email", data.user.email);
      setValue("title", data.user.title);
      setValue("role", data.user.role);
    } catch (error) {
      showError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setValue("firstName", user.firstName);
      setValue("lastName", user.lastName);
      setValue("email", user.email);
      setValue("title", user.title);
      setValue("role", user.role);
    }
  };

  const onSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          role: data.role,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update profile");
      }

      const result = await response.json();
      setUser(result.user);
      setIsEditing(false);
      showSuccess("Profile updated successfully");
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AuthenticationInput
              name="firstName"
              label="First Name"
              placeholder="Enter your first name"
              register={register}
              rules={{ required: "First Name is required" }}
              errors={errors}
              disabled={!isEditing}
            />
            <AuthenticationInput
              name="lastName"
              label="Last Name"
              placeholder="Enter your last name"
              register={register}
              rules={{ required: "Last Name is required" }}
              errors={errors}
              disabled={!isEditing}
            />
          </div>

          <AuthenticationInput
            name="email"
            label="Email"
            placeholder="Enter your email"
            register={register}
            rules={{
              required: "Email is required",
              pattern: {
                value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                message: "Invalid email address",
              },
            }}
            errors={errors}
            disabled={true} // Email cannot be changed
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DropSelect
              name="title"
              label="Title"
              placeholder="Select your title"
              control={control}
              options={titleOptions}
              errors={errors}
              disabled={!isEditing}
            />
            <DropSelect
              name="role"
              label="Role"
              placeholder="Select your role"
              control={control}
              options={roleOptions}
              errors={errors}
              disabled={!isEditing}
            />
          </div>

          {isEditing && (
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleCancel}
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
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Account Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">User ID:</span> {user.id}
            </div>
            <div>
              <span className="font-medium">Member since:</span>{" "}
              {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
