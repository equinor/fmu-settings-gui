import {
  Button,
  type ButtonProps,
  DotProgress,
  Tooltip,
} from "@equinor/eds-core-react";

type GeneralButtonProps = {
  label: string;
  isPending?: boolean;
  disabled?: boolean;
  tooltipText?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
} & Pick<ButtonProps, "variant" | "type">;

export function GeneralButton({
  type = "button",
  variant,
  label,
  disabled,
  isPending,
  tooltipText,
  onClick,
}: GeneralButtonProps) {
  return (
    <Tooltip title={tooltipText ?? ""}>
      <Button
        type={type}
        variant={variant}
        aria-disabled={disabled}
        onClick={
          disabled
            ? (e) => {
                e.preventDefault();
              }
            : onClick
        }
      >
        {isPending && (
          <DotProgress
            color={variant === "outlined" ? "primary" : undefined}
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
  disabled?: boolean;
  isPending?: boolean;
  helperTextDisabled?: string;
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
}: {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <GeneralButton
      type="reset"
      variant="outlined"
      label="Cancel"
      onClick={onClick}
    />
  );
}
