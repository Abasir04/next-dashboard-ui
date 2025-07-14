import { FC, JSX } from "react";
import { FieldErrors, UseFormRegister } from "react-hook-form";
interface InputProps {
  name: string;
  placeholder: string;
  label: string;
  rules?: object;
  register: UseFormRegister<any>;
  errors?: FieldErrors;
}
const AuthenticationInput: FC<InputProps> = ({
  name,
  placeholder,
  label,
  rules,
  register,
  errors,
}): JSX.Element => {
  return (
    <>
      <div className="flex flex-col w-full">
        <label htmlFor="firstname" className="text-sm pb-1 text-gray-900">
          {label}
        </label>
        <input
          {...register(name, rules)}
          name={name}
          placeholder={placeholder}
          className="flex border border-gray-300 text-dark text-base rounded p-3 shadow-sm"
        />
        {errors?.[name] && (
          <p className="text-red-500 text-sm mt-1">
            {errors[name]?.message as string}
          </p>
        )}
      </div>
    </>
  );
};

export default AuthenticationInput;
