import {
  Button,
  type ButtonProps,
  DotProgress,
  Tooltip,
} from "@equinor/eds-core-react";

type GeneralButtonProps = {
  label: string;
  isPending?: boolean | undefined;
  disabled?: boolean | undefined;
  tooltipText?: string | undefined;
  onClick?: ((e: React.MouseEvent<HTMLButtonElement>) => void) | undefined;
  onMouseDown?: ((e: React.MouseEvent<HTMLButtonElement>) => void) | undefined;
  variant?: ButtonProps["variant"] | undefined;
  color?: ButtonProps["color"] | undefined;
  type?: ButtonProps["type"] | undefined;
};

export function GeneralButton({
  type = "button",
  variant,
  color,
  label,
  disabled,
  isPending,
  tooltipText,
  onClick,
  onMouseDown,
}: GeneralButtonProps) {
  return (
    <Tooltip title={tooltipText ?? ""}>
      <Button
        type={type}
        aria-disabled={disabled}
        {...(variant !== undefined && { variant })}
        {...(color !== undefined && { color })}
        onClick={
          disabled
            ? (e) => {
                e.preventDefault();
              }
            : onClick
        }
        onMouseDown={onMouseDown}
      >
        {isPending && (
          <DotProgress
            {...(variant === "outlined" && { color: "primary" })}
            style={{ position: "absolute" }}
          />
        )}
        <span style={{ visibility: isPending ? "hidden" : undefined }}>
          {label}
        </span>
      </Button>
    </Tooltip>
  );
}

export function SubmitButton({
  label,
  disabled,
  isPending,
  helperTextDisabled = "Form can be submitted when errors have been resolved",
}: {
  label: string;
  disabled?: boolean | undefined;
  isPending?: boolean | undefined;
  helperTextDisabled?: string | undefined;
}) {
  return (
    <GeneralButton
      type="submit"
      label={label}
      disabled={disabled}
      isPending={isPending}
      tooltipText={disabled ? helperTextDisabled : undefined}
    />
  );
}

export function CancelButton({
  onClick,
  onMouseDown,
}: {
  onClick?: ((e: React.MouseEvent<HTMLButtonElement>) => void) | undefined;
  onMouseDown?: ((e: React.MouseEvent<HTMLButtonElement>) => void) | undefined;
}) {
  return (
    <GeneralButton
      type="reset"
      variant="outlined"
      label="Cancel"
      onClick={onClick}
      onMouseDown={onMouseDown}
    />
  );
}
