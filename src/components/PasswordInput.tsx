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
          placeholder={placeholder}
          type={showPassword ? "text" : "password"}
          className={`flex text-[#1E1E1E] text-base rounded p-3 pr-10 items-center w-full border-2 ${
            errors?.[name] ? "border-red-500" : "border-gray-300"
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
      {errors?.[name] && (
        <p className="text-red-500 text-sm mt-1">
          {errors[name]?.message as string}
        </p>
      )}
    </div>
  );
};

export default PasswordInput;
