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
      <Button onClick={onClick} disabled={disabled}>
        {label}
      </Button>
    </Tooltip>
  );
}

export function SubmitButton({
  label,
  disabled,
  isPending,
}: {
  label: string;
  disabled?: boolean;
  isPending?: boolean;
}) {
  return (
    <Tooltip
      title={
        disabled
          ? "Value can be submitted when it has been changed and is valid"
          : ""
      }
    >
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
    <Button type="reset" color="secondary" variant="outlined" onClick={onClick}>
      Cancel
    </Button>
  );
}
