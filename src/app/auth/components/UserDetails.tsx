import React from "react";
import { useForm } from "react-hook-form";
import DropSelect from "@/components/DropSelect";
import { showError } from "@/lib/toast";

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

const UserDetails = ({
  onComplete,
}: {
  onComplete: (data: any) => Promise<string | void>;
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { title: "", role: "" },
  });

  const onSubmit = async (data: any) => {
    const errorMsg = await onComplete(data);
    if (errorMsg) showError(errorMsg);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 w-full max-w-md mx-auto mt-8"
    >
      <DropSelect
        name="title"
        label="Title"
        placeholder="Select your title"
        control={control}
        options={titleOptions}
        errors={errors}
      />
      <DropSelect
        name="role"
        label="Role"
        placeholder="Select your role"
        control={control}
        options={roleOptions}
        errors={errors}
      />
      <button
        type="submit"
        className="w-full bg-primary text-white py-2 rounded hover:bg-indigo-700 transition"
      >
        Continue
      </button>
    </form>
  );
};

export default UserDetails;
