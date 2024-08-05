import { Box, BoxProps, useTheme } from "@mui/material";
import { merge } from "lodash";

export default function Prose({ children, ...props }: BoxProps) {
  const t = useTheme();
  return (
    <Box
      {...props}
      sx={merge(
        {
          ...t.typography.body1,
          "& h1": t.typography.h2,
          "& h2": t.typography.h3,
          "& h3": t.typography.h4,
          "& h4": t.typography.h5,
          "& h5": t.typography.h6,
          "& th": {
            ...t.typography.body1,
            color: t.palette.text.secondary,
            fontWeight: 550,
          },
          "& th, & td": {
            p: 1,
            textAlign: "left",
          },
          "& a": { color: t.palette.primary.main },
        },
        props.sx
      )}
    >
      {children}
    </Box>
  );
}
