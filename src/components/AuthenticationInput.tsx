import { FC, JSX } from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
interface InputProps {
  name: string;
  placeholder: string;
  label: string;
  type?: string;
  rules?: object;
  register: UseFormRegister<any>;
  errors?: FieldErrors;
  disabled?: boolean;
  required?: boolean;
}
const AuthenticationInput: FC<InputProps> = ({
  name,
  placeholder,
  label,
  type = "text",
  rules,
  register,
  errors,
  disabled = false,
  required = false,
}): JSX.Element => {
  return (
    <div className="flex flex-col w-full">
      <label htmlFor={name} className="text-sm pb-1 text-gray-900">
        {label}
      </label>
      <input
        {...register(name, rules)}
        name={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`flex text-dark text-base rounded p-3 shadow-sm border-2 ${
          errors?.[name] ? "border-red-500" : "border-gray-300"
        } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
      />
      {errors?.[name] && (
        <p className="text-red-500 text-sm mt-1">
          {errors[name]?.message as string}
        </p>
      )}
    </div>
  );
};

export default AuthenticationInput;
