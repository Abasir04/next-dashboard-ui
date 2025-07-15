import { FC, useState } from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { LuEye, LuEyeOff } from "react-icons/lu";

interface PasswordInputProps {
  name: string;
  placeholder: string;
  label: string;
  rules: object;
  errors?: FieldErrors;
  register: UseFormRegister<any>;
}

const PasswordInput: FC<PasswordInputProps> = ({
  name,
  placeholder,
  label,
  rules,
  register,
  errors,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="flex flex-col w-full">
      <label className="text-sm pb-2 text-gray-900">{label}</label>
      <div className="relative flex items-center w-full">
        <input
          {...register(name, rules)}
          name={name}
          placeholder={
            name === "confirmPassword"
              ? errors?.[name] &&
                errors[name]?.message === "Confirm password is required"
                ? (errors[name]?.message as string)
                : placeholder
              : errors?.[name]
              ? (errors[name]?.message as string)
              : placeholder
          }
          type={showPassword ? "text" : "password"}
          className={`flex text-[#1E1E1E] text-base rounded p-3 pr-10 items-center w-full border-2 border-gray-300 ${
            (name !== "confirmPassword" && errors?.[name]) ||
            (name === "confirmPassword" &&
              errors?.[name] &&
              errors[name]?.message === "Confirm password is required")
              ? "placeholder-red-500"
              : ""
          }`}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E1E1E] cursor-pointer flex items-center justify-center p-0 bg-transparent border-none"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
        </button>
      </div>
      {name === "confirmPassword" && (
        <div style={{ minHeight: "20px" }}>
          {errors?.[name] &&
          errors[name]?.message === "Passwords do not match" ? (
            <p className="text-red-500 text-xs pt-1">
              {errors[name]?.message as string}
            </p>
          ) : (
            <span className="invisible text-xs pt-1">placeholder</span>
          )}
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
