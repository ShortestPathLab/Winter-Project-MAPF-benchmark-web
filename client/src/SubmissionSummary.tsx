import {
  ArrowBackOutlined,
  DownloadOutlined,
  ExpandMoreOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import React, { ReactNode } from "react";

export type Props = {
  extras?: ReactNode;
  status?: ReactNode;
  apiKey?: string;
  summaryStats?: { name: string; count: number }[];
  detailStats?: { name: string; stats: { name: string; count: number }[] }[];
};

export default function SubmissionSummary({
  extras = [
    <Button startIcon={<DownloadOutlined />}>Download</Button>,
    <Button startIcon={<RefreshOutlined />}>Refresh</Button>,
  ],
  status = (
    <Chip
      sx={{ alignSelf: "flex-start" }}
      color="success"
      label="In Progress"
    ></Chip>
  ),
  apiKey = "sample_api_key",
  summaryStats = [
    { name: "Submitted", count: 42 },
    { name: "Validated", count: 24 },
    { name: "Failed", count: 0 },
    { name: "Not dominated", count: 5 },
  ],
  detailStats = [
    {
      name: "Map Progress",
      stats: [
        { name: "Total", count: 2 },
        { name: "Valid", count: 2 },
        { name: "Error", count: 2 },
      ],
    },
    {
      name: "Scenario Progress",
      stats: [
        { name: "Total", count: 2 },
        { name: "Valid", count: 2 },
        { name: "Error", count: 2 },
      ],
    },
    {
      name: "Instance Progress",
      stats: [
        { name: "Total", count: 2 },
        { name: "Valid", count: 2 },
        { name: "Error", count: 2 },
      ],
    },
  ],
}: Props) {
  return (
    <Stack
      sx={{
        maxWidth: 960,
        mx: "auto",
        p: 8,
        gap: 2,
      }}
    >
      <Button
        sx={{ alignSelf: "flex-start", mb: 4, color: "text.primary" }}
        startIcon={<ArrowBackOutlined />}
      >
        Back to Submissions
      </Button>
      <Typography variant="h4" component="h1">
        Submission Summary
      </Typography>
      <Typography>
        API Key: <code>{apiKey}</code>
      </Typography>

      <Stack direction="row" sx={{ mt: 2, gap: 4, alignItems: "center" }}>
        {status}
        <Box sx={{ flex: 1 }}></Box>
        {extras}
      </Stack>
      <Stack
        direction="row"
        sx={{
          gap: 4,
          p: 8,
          mt: 2,
          border: (t) => `1px solid ${t.palette.divider}`,
          justifyContent: "space-around",
        }}
      >
        {summaryStats.map(({ name, count }) => (
          <Stack sx={{ gap: 1 }}>
            <Typography variant="h4" component="h2">
              {count}
            </Typography>
            <Typography color="text.secondary">{name}</Typography>
          </Stack>
        ))}
      </Stack>
      <Stack sx={{ my: 4 }}>
        {detailStats.map(({ name, stats }) => (
          <>
            <Accordion
              sx={{
                boxShadow: "none",
                borderTop: (t) => `1px solid ${t.palette.divider}`,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreOutlined />}
                sx={{ px: 0, py: 2 }}
              >
                <Typography sx={{ fontWeight: 500 }}>{name}</Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  px: 0,
                }}
              >
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-evenly",
                    alignItems: "flex-start",
                  }}
                >
                  {stats.map(({ name, count }) => (
                    <Stack sx={{ gap: 1 }}>
                      <Typography variant="h4" component="h2">
                        {count}
                      </Typography>
                      <Typography color="text.secondary">{name}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </>
        ))}
      </Stack>
      <Button
        variant="contained"
        disableElevation
        size="large"
        sx={{ alignSelf: "flex-end", bgcolor: "text.primary" }}
      >
        Finish Submission
      </Button>
    </Stack>
  );
}
