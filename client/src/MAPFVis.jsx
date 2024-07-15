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

let max_time_step  = 0;
let grid_size = 0;
let grid_line_width = 0.05;
let map_size = 0;

/** 
 * Pre-processing step for visualising obstacles
 * @param {string} text newline-delimited content of a `.map` file
 * @returns 
 */
function parseMap(map) {
    
    // ignore the top 4 lines, we only want the map data...
    // ...which is separated by rows: \n, columns: "" 
    const map_content = map.trim().split(/\r?\n/).slice(4)
    
    // now convert any obstacles to "true" and free space to "false"
    return map_content.map(row => 
        [...row].map(val => val === "@" || val === "T")
    );
}

/**
 * Expand RLE-encoded records before processing them
 * @param {string} rle newline-delimited, RLE encoded
 * @returns decoded string
 */
function decodeRLE(rle) {
    return rle.replace(/(\d+)(\w)/g, 
        (_, count, move) => move.repeat(parseInt(count))
    );
}

/**
 * Pre-compute the action of every agent specified in text scene
 * @param {string} text newline-delimited content of a `.scen` file
 * @param {number} numAgents the number of agents in the solution path
 * @param {string} solutionString newline-delimited solution path for a particular instance
 */
function parseScen(scen, numAgents, solutionString) {
    
    // TODO: change from math origin to pixel origin
    const moves = {
        'u': { x: 0, y: 1 },
        'd': { x: 0, y: -1 },
        'l': { x: -1, y: 0 },
        'r': { x: 1, y: 0 }
    };

    // extract the content from the .scen file
    var scen_content = scen.trim().split(/\r?\n/);
    
    // retrieve the x-y coordinates for each agent from the content
    let agent_state = Array.from({ length: numAgents }, (_, i) => {
        const [, , , , x, y] = scen_content[i + 1].split('\t');
        return [{ x: parseInt(x), y: parseInt(y) }];
    });

    // len = `numAgents`
    const movement_log = solutionString.trim().split('\n');

    movement_log.forEach((agent_solution, i) => {

        // this is a global variable, update it for vis purposes later
        max_time_step = Math.max(max_time_step, agent_solution.length);

        const decodedSolution = decodeRLE(agent_solution);
        
        // now track the actions of each agent at each 
        agent_state[i] = decodedSolution.split('').reduce((path, move) => {
            const last = path[path.length - 1];

            // agent either moves or waits
            const { x = 0, y = 0 } = moves[move] || {};
            path.push({ x: last.x + x, y: last.y + y });

            return path;
        }, agent_state[i]);
    });

    return agent_state;
}

function render_map(ctx,map){
    var current_y = 0;
    for(var i = 0; i < map.length; i++){
        var current_x = 0;
        for(var j = 0; j < map[i].length; j++){
            // ctx.fillStyle = 'white'

            var state = map[i][j]
            if(state){
                ctx.lineWidth = grid_line_width;
                ctx.fillStyle = 'black'
                ctx.fillRect(current_x,current_y,grid_size,grid_size);
            }else{
                ctx.lineWidth = grid_line_width;
                ctx.strokeStyle = 'black'
                ctx.strokeRect(current_x,current_y,grid_size,grid_size);
            }
            current_x = current_x + grid_size;
        }
        current_y  = current_y + grid_size;
    }

}

function render_agents_timesteps(ctx,solution,color,clear_timeSteps,render_timesteps){
    for(var i = 0; i < solution.length;i++){
        var agent_solution = solution[i];
        var clear_location = clear_timeSteps >agent_solution.length-1 ? agent_solution[agent_solution.length-1] : agent_solution[clear_timeSteps];
        var render_location = render_timesteps >agent_solution.length-1 ? agent_solution[agent_solution.length-1] : agent_solution[render_timesteps];
        if(clear_location !== render_location){
            ctx.strokeStyle = 'black';
            ctx.lineWidth = grid_line_width;
            ctx.clearRect(clear_location.x * grid_size, clear_location.y * grid_size, grid_size, grid_size);
            ctx.strokeRect(clear_location.x * grid_size, clear_location.y * grid_size, grid_size, grid_size);
            ctx.fillStyle = color[i];
            ctx.fillRect(render_location.x * grid_size, render_location.y*grid_size, grid_size, grid_size);
        }
    }
}

function render_agents(ctx,solution,color,timeSteps,total_width, total_height){
    ctx.clearRect(0,0,total_width, total_height);
    for(var i = 0; i < solution.length;i++){
        var agent_solution = solution[i];
        if(agent_solution.length > timeSteps){
            ctx.fillStyle = color[i];
            ctx.fillRect(agent_solution[timeSteps].x * grid_size, agent_solution[timeSteps].y*grid_size, grid_size, grid_size);
        }else{
            if(agent_solution.length !== 0){
                ctx.fillStyle = color[i];
                ctx.fillRect(agent_solution[agent_solution.length - 1].x * grid_size, agent_solution[agent_solution.length - 1].y*grid_size, grid_size, grid_size);
            }
        }
    }
}

const Visualization = () => {

    // get canvas
    const canvasRef = useRef()
    const agentcanvasRef = useRef()
    const invisiblecanvasRef = useRef()

    // set frame counter
    const [counter, setCounter] = useState(0)
    const [shouldStop, setShouldStop] = useState(true)
    const [data, setData] = useState("")
    const [map, setMap] = useState([[]])
    const [solution, setSolution] = useState([[]])
    const [color, setColor] = useState([])
    const [speed, setSpeed] = useState(60)

    const [timeSteps, setTimeSteps] = useState(0)

    const navigate = useNavigate();
    const location = useLocation();
    const [canvas_setting, setCanvas_setting] = useState({width : 750, height : 750})
    const [scale, setScale] = useState(1)
    const [imageData, setImageData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [original_canvas_setting, setOriginal_canvas_setting] = useState({width : 750, height : 750})

    //
    useEffect(() => {
        max_time_step  = 0;
        grid_size = 0;
        grid_line_width = 0.05;
        map_size = 0;
        fetch(APIConfig.apiUrl+'/solution_path/'+location.state.path_id, {method: 'GET'})
            .then(res => res.json())
            .then(data => {
                setData(data.solution_path);
            }).catch(err => console.error(err));
        }, []
    );

    useEffect(() => {
        if(data.length !== 0 ) {

            var map_file = location.state.map_name + ".map"
            // var map_file = "brc202d.map"
            // var map_file = "empty-48-48.map"
            // var map_file = "warehouse-10-20-10-2-2.map"
            // var map_file = "w_woundedcoast.map"
            // var map_file = "orz900d.map"
            var map_path = "./assets/maps/" + map_file;

            var agent = location.state.num_agents;
            var color = Array(agent)
                .fill()
                .map((currElement, index) =>
                    currElement=randomColor({seed :  100*index})
                );
            setColor(color);


            var solution_string = data;
            // "uuuu\ndddd\nlllll\nrrrr"
            var scen = location.state.scen_string + ".scen";

            var scen_path = "./assets/scens/" + scen;


            Promise.all([fetch(map_path), fetch(scen_path)])
                .then((values) => {
                    return Promise.all(values.map((r) => r.text()))
                })
                .then(([map_text, scen_text]) => {
                    setMap(parseMap(map_text));
                    setSolution(parseScen(scen_text, agent, solution_string));
                }).catch(err => console.error(err));
        }
        }, [data]
    );


    useEffect(() => {
        if(map.length > 1){
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0,0,canvas_setting.width,canvas_setting.height);
            var map_height= map.length;
            var map_width = map[0].length;
            var grid_height = canvas_setting.height/map_height;
            var grid_width = canvas_setting.width/map_width;
            grid_size =  grid_height < grid_width ? grid_height : grid_width;
            map_size = map_height*map_width;
            if(grid_size > 1){
                // round to int if possible.
                grid_size = Math.floor(grid_size);
            }else{
                grid_size = 1;
            }
            grid_height = grid_size * map_height;
            grid_width = grid_size * map_width;
            setCanvas_setting({width: grid_width, height: grid_height});
            setOriginal_canvas_setting({width: grid_width, height: grid_height});
        }
    }, [map]);


    const usePrevious = (value) => {
        const ref = useRef();
        useEffect(() => {
            ref.current = value;
        });
        return ref.current;
    };

    const previousTimeSteps = usePrevious(timeSteps);
    const previousShouldStop = usePrevious(shouldStop);
    useEffect(
        () => {
            if(imageData === null && map.length > 1){
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0,0,canvas_setting.width,canvas_setting.height);
                render_map(ctx,map);
                var image = ctx.getImageData(0, 0, canvas_setting.width , canvas_setting.height);
                setImageData(image);
                const agent_canvas = agentcanvasRef.current;
                const agent_context = agent_canvas.getContext('2d');
                render_agents( agent_context, solution, color,timeSteps,canvas_setting.width,canvas_setting.height);
                setLoading(false);
            }else if (!loading){
                grid_size = canvas_setting.height/ map.length;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (map_size < 100000){
                    ctx.clearRect(0,0,canvas_setting.width,canvas_setting.height);
                    render_map(ctx,map);
                }else{
                    const  newCanvas= invisiblecanvasRef.current;
                    newCanvas.width = original_canvas_setting.width;
                    newCanvas.height = original_canvas_setting.height;
                    newCanvas.getContext("2d").putImageData(imageData, 0, 0);
                    ctx.scale(scale,scale);
                    ctx.drawImage(newCanvas, 0, 0);
                    newCanvas.width = canvas_setting.width;
                    newCanvas.height = canvas_setting.height;
                }
                const agent_canvas = agentcanvasRef.current;
                const agent_context = agent_canvas.getContext('2d');
                render_agents( agent_context, solution, color,timeSteps,canvas_setting.width,canvas_setting.height);
                setShouldStop(previousShouldStop);
            }

        } , [canvas_setting]
    )



        // output graphics
    useEffect(() => {
        if(timeSteps >= 0 ) {
            const canvas = agentcanvasRef.current
            const context = canvas.getContext('2d')
            render_agents(context, solution, color,timeSteps,canvas_setting.width,canvas_setting.height);
            // render_agents_timesteps(context, solution, color,previousTimeSteps, timeSteps);
        }
    }, [timeSteps])




    useEffect(() => {
        if(counter === speed){
            setCounter(0);
            setTimeSteps(t => t +1);
            if(timeSteps === max_time_step){
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
            setCanvas_setting({width: original_canvas_setting.width*(current_scale), height: original_canvas_setting.height*(current_scale )});
        }
    }

    return (
        <div className="container">
        {loading ? (
                <div className="loader-container">
                    <div className="spinner">
                    </div>
                </div>
            ) : (null)}
        <div  style={{ backgroundColor: 'grey', width : "fit-content", height : "100%"
        }}>

            <div style={{ display: "grid", minHeight: "calc(100vh - 100px)",minWidth: "calc(100vw - 100px)", paddingTop: "70px",paddingBottom: "70px",paddingRight: "70px",paddingLeft: "70px"}}>
                <canvas ref={invisiblecanvasRef} width={0} height= {0}
                        style={{zIndex: 0,
                            gridArea: "2 / 2 / 2 / 2"
                        }}/>
                <canvas ref={canvasRef} width={canvas_setting.width} height={canvas_setting.height}
                        style={{ backgroundColor: 'white',zIndex: 1,
                            gridArea: "2 / 2 / 2 / 2"
                    }}
                />
                <canvas ref={agentcanvasRef} width={canvas_setting.width} height={canvas_setting.height}
                        style={{zIndex: 2,
                            gridArea: "2 / 2 / 2 / 2"
                }}/>

            </div>
            <AppBar position="fixed" color="grey" sx={{ top: 'auto', bottom: 0 }}>
                <Toolbar>
                    <IconButton
                        onClick={() => setTimeSteps(t => t - 1 < 0 ?  max_time_step : t-1)}
                    >
                        <SkipPreviousIcon />
                    </IconButton>

                    <IconButton
                        onClick={() => setShouldStop(!shouldStop)}
                    >
                        { shouldStop ? <PlayCircleIcon /> : <PauseCircleIcon/>  }
                    </IconButton>

                    <IconButton
                        onClick={() => setTimeSteps(t => t + 1 > max_time_step ?  0 : t+1)}
                    >
                        <SkipNextIcon />
                    </IconButton>
                    <Slider value={timeSteps} min={0}
                            max={max_time_step} valueLabelDisplay="on"/>
                    <Select
                        IconComponent = {ShutterSpeedIcon}
                        value={speed}
                        onChange={handleChange}

                        sx={{ '.MuiOutlinedInput-notchedOutline': { border: 0 },     "&:hover": {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                borderRadius: "5px"
                            }}}
                    >
                        <MenuItem value={15}>4x</MenuItem>
                        <MenuItem value={30}>2x</MenuItem>
                        <MenuItem value={60}>1x</MenuItem>
                        <MenuItem value={120}>0.5x</MenuItem>
                    </Select>

                    <IconButton
                        onClick={handleChangeCanvas(0.2)}
                    >
                        <AddCircleOutlineIcon />
                    </IconButton>
                    <IconButton
                        onClick={handleChangeCanvas(-0.2)}
                    >
                        <RemoveCircleOutlineIcon  />
                    </IconButton>
                </Toolbar>
            </AppBar>
        </div>

        </div>
    )
}

export default Visualization ;
