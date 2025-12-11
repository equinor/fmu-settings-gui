import { Button, DotProgress, Tooltip } from "@equinor/eds-core-react";

export function GeneralButton({
  label,
  disabled,
  tooltipText,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  tooltipText?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Tooltip title={tooltipText ?? ""}>
      <Button
        aria-disabled={disabled}
        onClick={
          disabled
            ? (e) => {
                e.preventDefault();
              }
            : onClick
        }
      >
        {label}
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
    <Tooltip title={disabled ? helperTextDisabled : undefined}>
      <Button
        type="submit"
        aria-disabled={disabled}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
          }
        }}
      >
        {isPending ? <DotProgress /> : label}
      </Button>
    </Tooltip>
  );
}

export function CancelButton({
  onClick,
}: {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Button type="reset" variant="outlined" onClick={onClick}>
      Cancel
    </Button>
  );
}
