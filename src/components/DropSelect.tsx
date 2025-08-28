import { Select } from "antd";
import { FC, JSX } from "react";
import { Controller, Control, FieldErrors } from "react-hook-form";

interface Option {
  label: string;
  value: string | number;
}

interface SelectProps {
  name: string;
  label?: string;
  placeholder?: string;
  control: Control<any>;
  options: Option[];
  errors?: FieldErrors;
  disabled?: boolean;
  onChange?: (value: string | number | undefined) => void;
  value?: string | number | null;
  wrapperClassName?: string;
}

const DropSelect: FC<SelectProps> = ({
  name,
  label,
  placeholder,
  control,
  options,
  errors,
  disabled = false,
  onChange,
  value,
  wrapperClassName,
}): JSX.Element => {
  return (
    <div className="flex flex-col w-full">
      {label && (
        <label htmlFor={name} className="text-sm pb-1 text-gray-900">
          {label}
        </label>
      )}
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <div
            className={` bg-white border border-gray-300 rounded py-1 ${
              disabled ? "opacity-60 cursor-not-allowed" : ""
            } ${wrapperClassName || ""}`}
          >
            <Select
              className="w-full custom-select"
              options={options}
              value={value !== undefined ? value : field.value}
              onChange={(val) => {
                field.onChange(val);
                if (onChange) onChange(val);
              }}
              placeholder={placeholder}
              variant="borderless"
              disabled={disabled}
            />
          </div>
        )}
        disabled={disabled}
      />
      {errors?.[name] && (
        <p className="text-red-500 text-sm mt-1">
          {errors[name]?.message as string}
        </p>
      )}
    </div>
  );
};

export default DropSelect;
