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
        <label htmlFor={name} className="text-sm pb-1 text-gray-900">
          {label}
        </label>
        <input
          {...register(name, rules)}
          name={name}
          placeholder={
            errors?.[name] ? (errors[name]?.message as string) : placeholder
          }
          className={`flex text-dark text-base rounded p-3 shadow-sm border-2 border-gray-300 ${
            errors?.[name] ? "placeholder-red-500" : ""
          }`}
        />
      </div>
    </>
  );
};

export default AuthenticationInput;
