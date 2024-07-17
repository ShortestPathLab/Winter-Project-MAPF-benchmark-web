import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PauseOutlined,
  PlayArrowOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@mui/icons-material";
import {
  Box,
  Card,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  colors,
  useTheme,
} from "@mui/material";
import { Container, Graphics, Stage } from "@pixi/react";
import { capitalize, clamp, min, range, trim, values } from "lodash";
import { Graphics as PixiGraphics } from "pixi.js";
import React, { useMemo, useReducer } from "react";
import { useLocation } from "react-router-dom";
import AutoSize from "react-virtualized-auto-sizer";
import { usePlayback } from "./usePlayback";
import { useSolution } from "./useSolution";
import PageHeader from "./PageHeader";

export const { common, ...accentColors } = colors;

const accentColorsList = values(accentColors);

const LINE_WIDTH = 0.05;

const drawGrid =
  ({ x: width, y: height }: { x: number; y: number }, color: string) =>
  (g: PixiGraphics) => {
    g.clear();
    g.lineStyle(LINE_WIDTH, hexToInt(color));
    for (const x of range(width + 1)) {
      g.moveTo(x, 0).lineTo(x, height);
    }
    for (const y of range(height + 1)) {
      g.moveTo(0, y).lineTo(width, y);
    }
  };

const drawAgents =
  (agents: { color: string; x: number; y: number }[]) => (g: PixiGraphics) => {
    g.clear();
    for (const { x, y, color } of agents) {
      g.beginFill(hexToInt(color)).drawRect(x, y, 1, 1).endFill();
    }
  };

const Visualization = () => {
  const theme = useTheme();
  const location = useLocation();

  const [scale1, zoom] = useReducer(
    (prev, next: "in" | "out") =>
      clamp(next === "in" ? prev + 0.1 : prev - 0.1, 0, 1.5),
    0.8
  );

  const { map, result, getAgentPosition } = useSolution({
    path: location.state.path_id,
    agentCount: location.state.num_agents,
    map: location.state.map_name,
    scenario: location.state.scen_string,
  });

  const { timespan = 0, x = 0, y = 0 } = result ?? {};

  const { step, backwards, forwards, play, pause, paused } =
    usePlayback(timespan);

  const grid = useMemo(
    () =>
      drawGrid({ x, y }, theme.palette.mode === "dark" ? "#ffffff" : "#000000"),
    [x, y, theme.palette.mode]
  );

  const agents = useMemo(() => {
    const positions = getAgentPosition(step);
    return drawAgents(
      positions.map(({ x, y }, i) => ({
        x,
        y,
        color:
          accentColorsList[i % accentColorsList.length][
            theme.palette.mode === "dark" ? "300" : "A100"
          ],
      }))
    );
  }, [getAgentPosition, step, theme.palette.mode]);

  const scale = (width: number, height: number) =>
    (min([width, height])! / min([x, y])!) * scale1;

  const offsetX = (w: number, h: number) => (w - scale(w, h) * x) / 2;
  const offsetY = (w: number, h: number) => (h - scale(w, h) * y) / 2;

  const scenarioString = capitalize(
    `${location.state.scenType}-${location.state.scenTypeID}`
  );
  return (
    <Box
      sx={{
        width: "100vw",
        //TODO: actual height
        height: "calc(100vh - 88px)",
        position: "fixed",
        left: 0,
        //TODO: don't hardcode position
        top: 88,
      }}
    >
      <Stack sx={{ position: "fixed", p: 4, top: 88, left: 0 }}>
        <PageHeader
          current="View"
          path={[
            { name: "MAPF Tracker", url: "/" },
            { name: "Benchmarks", url: "/benchmarks" },
            {
              name: capitalize(location.state.map_name),
              url: "/scenarios",
              state: location.state,
            },
            {
              name: scenarioString,
              url: "/instances",
              state: location.state,
            },
          ]}
        />
      </Stack>
      <AutoSize>
        {(size) => (
          <Stage
            key={theme.palette.mode}
            {...size}
            options={{
              backgroundColor: hexToInt(theme.palette.background.default),
              antialias: true,
            }}
          >
            <Container
              scale={scale(size.width, size.height)}
              x={offsetX(size.width, size.height)}
              y={offsetY(size.width, size.height)}
            >
              <Graphics draw={agents} />
              <Graphics draw={grid} alpha={0.7} />
            </Container>
          </Stage>
        )}
      </AutoSize>
      <Stack
        sx={{
          position: "fixed",
          right: 0,
          bottom: 0,
          p: 4,
        }}
      >
        <Card sx={{ py: 1, px: 2 }}>
          <Stack direction="row" sx={{ gap: 2, alignItems: "center" }}>
            <Typography sx={{ px: 2 }}>
              {step} / {timespan}
            </Typography>
            <Divider orientation="vertical" flexItem />
            {[
              {
                name: "Step back",
                icon: <ArrowLeftOutlined />,
                action: backwards,
              },
              {
                name: paused ? "Play" : "Pause",
                icon: paused ? <PlayArrowOutlined /> : <PauseOutlined />,
                action: paused ? play : pause,
              },
              {
                name: "Step forwards",
                icon: <ArrowRightOutlined />,
                action: forwards,
              },
              {
                name: "Zoom in",
                icon: <ZoomInOutlined />,
                action: () => zoom("in"),
              },
              {
                name: "Zoom out",
                icon: <ZoomOutOutlined />,
                action: () => zoom("out"),
              },
            ].map(({ name, icon, action }) => (
              <Tooltip title={name}>
                <IconButton onClick={action}>{icon}</IconButton>
              </Tooltip>
            ))}
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
};

export default Visualization;
function hexToInt(s: string) {
  return parseInt(trim(s, "#"), 16);
}
