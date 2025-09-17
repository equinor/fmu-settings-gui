import { Button, DotProgress, Tooltip } from "@equinor/eds-core-react";

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
