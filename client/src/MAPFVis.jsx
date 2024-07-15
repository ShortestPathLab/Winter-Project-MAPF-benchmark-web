import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { useLocation, useNavigate } from "react-router-dom";
import randomColor from "randomcolor";
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import ShutterSpeedIcon from '@mui/icons-material/ShutterSpeed';
import Slider from '@mui/material/Slider';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { APIConfig } from "./config";
import { useTheme } from '@mui/material';
import React from 'react';


const GRIDLINEWIDTH = 0.05;

let maxTime  = 0;
let gridSize = 0;
let mapSize = 0;


function parseMap(map) {
    
    // ignore the top 4 lines, we only want the map data...
    // ...which is separated by rows: \n, columns: "" 
    const mapContent = map.trim().split(/\r?\n/).slice(4)
    
    // now convert any obstacles to "true" and free space to "false"
    return mapContent.map(row => 
        [...row].map(val => val === "@" || val === "T")
    );
}


function decodeRLE(rle) {
    return rle.replace(/(\d+)(\w)/g, 
        (_, count, move) => move.repeat(parseInt(count))
    );
}


function parseScen(scen, numAgents, solutionString) {

    // utilise pixel origin
    const moves = {
        'u': { x: 0, y: -1 },
        'd': { x: 0, y: 1 },
        'l': { x: -1, y: 0 },
        'r': { x: 1, y: 0 }
    };

    // extract the content from the .scen file
    var scenContent = scen.trim().split(/\r?\n/);
    
    // retrieve the x-y coordinates for each agent from the content
    let agentState = Array.from({ length: numAgents }, (_, i) => {
        const [, , , , x, y] = scenContent[i + 1].split('\t');
        return [{ x: parseInt(x), y: parseInt(y) }];
    });

    // len = `numAgents`
    const movementLog = solutionString.trim().split('\n');

    movementLog.forEach((agentSolution, i) => {

        // this is a global variable, update it for vis purposes later
        maxTime = Math.max(maxTime, agentSolution.length);

        const decodedSolution = decodeRLE(agentSolution);
        
        // now track the actions of each agent at each 
        agentState[i] = decodedSolution.split('').reduce((path, move) => {
            const last = path[path.length - 1];

            // agent either moves or waits
            const { x = 0, y = 0 } = moves[move] || {};
            path.push({ x: last.x + x, y: last.y + y });

            return path;
        }, agentState[i]);
    });

    return agentState;
}

function renderMap(ctx, map) {
    ctx.lineWidth = GRIDLINEWIDTH;
    
    map.forEach((row, i) => {
        row.forEach((isObstacle, j) => {
            const x = j * gridSize;
            const y = i * gridSize;
            
            if (isObstacle) {
                ctx.fillRect(x, y, gridSize, gridSize);
            } else {
                ctx.strokeRect(x, y, gridSize, gridSize);
            }
        });
    });
}


function renderAgents(ctx, solution, color, time, canvasConfig) {
    ctx.clearRect(0, 0, canvasConfig['width'], canvasConfig['height']);
    
    solution.forEach((agentSolution, i) => {
        if (agentSolution.length === 0) return;
        
        // prevent reading outside solution array
        const pos = agentSolution[Math.min(time, agentSolution.length - 1)];
        ctx.fillStyle = color[i];
        ctx.fillRect(pos.x * gridSize, pos.y * gridSize, gridSize, gridSize);
    });
}


const Visualization = () => {
    const canvasRef = useRef()
    const agentcanvasRef = useRef()
    const invisiblecanvasRef = useRef()
    const [counter, setCounter] = useState(0)
    const [shouldStop, setShouldStop] = useState(true)
    const [data, setData] = useState("")
    const [map, setMap] = useState([[]])
    const [solution, setSolution] = useState([[]])
    const [color, setColor] = useState([])
    const [speed, setSpeed] = useState(60)
    const [timeSteps, setTimeSteps] = useState(0)
    const location = useLocation();
    const [currCanvasConfig, setCurrCanvasConfig] = useState({width : 750, height : 750})
    const [scale, setScale] = useState(1)
    const [imageData, setImageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [canvasConfig, setCanvasConfig] = useState({width : 750, height : 750})

    useEffect(() => {
        fetch(`${APIConfig.apiUrl}/solution_path/${location.state.path_id}`, {method: 'GET'})
            .then(res => res.json())
            .then(data => {
                setData(data.solution_path);
            }).catch(err => console.error(err));
        }, []
    );

    useEffect(() => {
        if (data.length === 0) return;
    
        const numAgents = location.state.num_agents;
        const mapPath = `./assets/maps/${location.state.map_name}.map`;
        const scenPath = `./assets/scens/${location.state.scen_string}.scen`;
    
        // generate one random color per agent
        setColor(Array.from({ length: numAgents }, (_, index) =>
            randomColor({ seed: 100 * index })
        ));
    
        Promise.all([
            fetch(mapPath).then(r => r.text()),
            fetch(scenPath).then(r => r.text())
        ])
            .then(([map_text, scen_text]) => {
                setMap(parseMap(map_text));
                setSolution(parseScen(scen_text, numAgents, data));
            })
            .catch(console.error);
    }, [data, location.state]);

    useEffect(() => {
        if(map.length > 1){
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0,0,currCanvasConfig.width,currCanvasConfig.height);
            var map_height= map.length;
            var map_width = map[0].length;
            var grid_height = currCanvasConfig.height/map_height;
            var grid_width = currCanvasConfig.width/map_width;
            gridSize =  grid_height < grid_width ? grid_height : grid_width;
            mapSize = map_height*map_width;
            if(gridSize > 1){
                // round to int if possible.
                gridSize = Math.floor(gridSize);
            }else{
                gridSize = 1;
            }
            grid_height = gridSize * map_height;
            grid_width = gridSize * map_width;
            setCurrCanvasConfig({width: grid_width, height: grid_height});
            setCanvasConfig({width: grid_width, height: grid_height});
        }
    }, [map]);

    const usePrevious = (value) => {
        const ref = useRef();
        useEffect(() => {
            ref.current = value;
        });
        return ref.current;
    };

    const previousShouldStop = usePrevious(shouldStop);
    useEffect(
        () => {
            if(imageData === null && map.length > 1){
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0,0,currCanvasConfig.width,currCanvasConfig.height);
                renderMap(ctx,map);
                var image = ctx.getImageData(0, 0, currCanvasConfig.width , currCanvasConfig.height);
                setImageData(image);
                const agent_canvas = agentcanvasRef.current;
                const agent_context = agent_canvas.getContext('2d');
                renderAgents( agent_context, solution, color,timeSteps,currCanvasConfig);
                setLoading(false);
            }else if (!loading){
                gridSize = currCanvasConfig.height/ map.length;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (mapSize < 100000){
                    ctx.clearRect(0,0,currCanvasConfig.width,currCanvasConfig.height);
                    renderMap(ctx,map);
                }else{
                    const  newCanvas= invisiblecanvasRef.current;
                    newCanvas.width = canvasConfig.width;
                    newCanvas.height = canvasConfig.height;
                    newCanvas.getContext("2d").putImageData(imageData, 0, 0);
                    ctx.scale(scale,scale);
                    ctx.drawImage(newCanvas, 0, 0);
                    newCanvas.width = currCanvasConfig.width;
                    newCanvas.height = currCanvasConfig.height;
                }
                const agent_canvas = agentcanvasRef.current;
                const agent_context = agent_canvas.getContext('2d');
                renderAgents( agent_context, solution, color,timeSteps,currCanvasConfig);
                setShouldStop(previousShouldStop);
            }

        } , [currCanvasConfig]
    )

    // output graphics
    useEffect(() => {
        if(timeSteps >= 0 ) {
            const canvas = agentcanvasRef.current
            const context = canvas.getContext('2d')
            renderAgents(context, solution, color,timeSteps,currCanvasConfig);
        }
    }, [timeSteps])

    useEffect(() => {
        if(counter === speed){
            setCounter(0);
            setTimeSteps(t => t +1);
            if(timeSteps === maxTime){
                setTimeSteps(0);
            }
        }
    }, [counter])

    // update the counter
    useLayoutEffect(() => {
        if (!shouldStop) {
            let timerId

            const animate = () => {
                setCounter(c => c + 1)
                timerId = requestAnimationFrame(animate)
            }
            timerId = requestAnimationFrame(animate)
            return () => cancelAnimationFrame(timerId)
        }
    }, [shouldStop])

    const handleChange = (event) => {
        setSpeed(event.target.value);
        setCounter(0);
    };

    const handleChangeCanvas = (value) => ()  =>{
        setShouldStop(true)
        var current_scale = scale + value;
        if(current_scale > 0){
            setScale(current_scale);
            setCurrCanvasConfig({width: canvasConfig.width*(current_scale), height: canvasConfig.height*(current_scale )});
        }
    }

    return (
        <div className="container">
          {loading && (
            <div className="loader-container">
              <div className="spinner"></div>
            </div>
          )}
          <div style={{ width: "100%", height: "100%" }}>
            <div style={{ display: "grid", margin: "0 auto" }}>
              <canvas ref={invisiblecanvasRef} width={0} height={0} style={{ zIndex: 0, gridArea: "2 / 2 / 2 / 2" }} />
              <canvas ref={canvasRef} width={currCanvasConfig.width} height={currCanvasConfig.height} style={{ backgroundColor: 'white', zIndex: 1, gridArea: "2 / 2 / 2 / 2" }} />
              <canvas ref={agentcanvasRef} width={currCanvasConfig.width} height={currCanvasConfig.height} style={{ zIndex: 2, gridArea: "2 / 2 / 2 / 2" }} />
            </div>
            <AppBar position="fixed" color="grey" sx={{ top: 'auto', bottom: 0 }}>
              <Toolbar>
                <IconButton onClick={() => setTimeSteps(t => t - 1 < 0 ? maxTime : t - 1)}>
                  <SkipPreviousIcon />
                </IconButton>
                <IconButton onClick={() => setShouldStop(!shouldStop)}>
                  {shouldStop ? <PlayCircleIcon /> : <PauseCircleIcon />}
                </IconButton>
                <IconButton onClick={() => setTimeSteps(t => t + 1 > maxTime ? 0 : t + 1)}>
                  <SkipNextIcon />
                </IconButton>
                <Slider value={timeSteps} min={0} max={maxTime} valueLabelDisplay="on" />
                <Select
                  IconComponent={ShutterSpeedIcon}
                  value={speed}
                  onChange={handleChange}
                  sx={{
                    '.MuiOutlinedInput-notchedOutline': { border: 0 },
                    "&:hover": { backgroundColor: 'rgba(0, 0, 0, 0.04)', borderRadius: "5px" }
                  }}
                >
                  <MenuItem value={5}>12x</MenuItem>
                  <MenuItem value={15}>4x</MenuItem>
                  <MenuItem value={30}>2x</MenuItem>
                  <MenuItem value={60}>1x</MenuItem>
                  <MenuItem value={120}>0.5x</MenuItem>
                </Select>
                <IconButton onClick={handleChangeCanvas(0.2)}>
                  <AddCircleOutlineIcon />
                </IconButton>
                <IconButton onClick={handleChangeCanvas(-0.2)}>
                  <RemoveCircleOutlineIcon />
                </IconButton>
              </Toolbar>
            </AppBar>
          </div>
        </div>
      )
}


export default Visualization ;
