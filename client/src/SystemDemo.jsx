import * as React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Toolbar from "@mui/material/Toolbar";
import Divider from "@mui/material/Divider";
// import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { Link, Stack, Tooltip } from "@mui/material";
import FileCopyIcon from "@mui/icons-material/FileCopyOutlined";
import { useState } from "react";
import "./BibTex.css"; // Import the CSS file for styling
import ClipboardJS from "clipboard";
import PageHeader from "./PageHeader";

const bibtexEntry = `@misc{MAPF_Tracker,
  doi = {10.48550/arXiv.2305.08446},
  url = {https://arxiv.org/abs/2305.08446},
  author = {Bojie Shen and Zhe Chen and Muhammad Aamir Cheema and Daniel D. Harabor and Peter J. Stuckey}, 
  title = {Tracking Progress in Multi-Agent Path Finding}, 
  publisher = {arXiv},
  year = {2023}
}`;
export default function SystemDemo() {
  const item_width = 300;
  const [copySuccess, setCopySuccess] = useState(false);

  // const handleCopyClick = async () => {
  //     try {
  //         await navigator.clipboard.writeText(bibtexEntry);
  //         setCopySuccess(true);
  //     } catch (error) {
  //         console.error('Failed to copy BibTeX code:', error);
  //     }
  // };
  // const handleCopyClick = async () => {
  //     try {
  //         await clipboardy.write(bibtexEntry);
  //         setCopySuccess(true);
  //     } catch (error) {
  //         console.error('Failed to copy BibTeX code:', error);
  //     }
  // };

  // const handleCopyClick = () => {
  //     try {
  //         copyPaste.copy(bibtexEntry);
  //         setCopySuccess(true);
  //     } catch (error) {
  //         console.error('Failed to copy BibTeX code:', error);
  //     }
  // };

  const handleCopyClick = () => {
    const copyButton = document.createElement("button");
    copyButton.setAttribute("data-clipboard-text", bibtexEntry);

    const clipboard = new ClipboardJS(copyButton);

    clipboard.on("success", () => {
      setCopySuccess(true);
      clipboard.destroy();
    });

    clipboard.on("error", (e) => {
      console.error("Failed to copy BibTeX code:", e);
      clipboard.destroy();
    });

    copyButton.click();
  };

  return (
    <Stack sx={{ mx: "auto", maxWidth: 960, gap: 4, py: 6 }}>
      <PageHeader
        current="System demo"
        path={[{ name: "MAPF Tracker", url: "/" }]}
      />
      <Paper>
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
          }}
        >
          <Typography
            sx={{ flex: "1 1 100%", paddingLeft: "10px" }}
            variant="h6"
            component="div"
          >
            Papers and Demo
          </Typography>
        </Toolbar>
        <Divider />
        <Box
          sx={{
            paddingTop: "15px",
            paddingLeft: "35px",
            paddingRight: "35px",
            paddingBottom: "35px",
          }}
        >
          <Typography
            sx={{ fontSize: 16, flex: "1 1 100%", paddingBottom: "15px" }}
            component="div"
          >
            This web platform is presented at{" "}
            <Link href="https://icaps23.icaps-conference.org">ICAPS 2023</Link>{" "}
            system demo track. That paper can be accessed{" "}
            <Link href="https://icaps23.icaps-conference.org/demos/papers/255_paper.pdf">
              here
            </Link>
            . A full length manuscript is available from{" "}
            <Link href="https://arxiv.org/abs/2305.08446">arXiv</Link>. When
            using our website, please cite the following:
          </Typography>

          {/*<ul>*/}
          {/*    <Typography*/}
          {/*        sx={{fontSize: 16, flex: '1 1 100%'}}*/}
          {/*        component="li"*/}
          {/*    >*/}
          {/*        The paper can be accessed at  <Link href="https://icaps23.icaps-conference.org">here</Link>.*/}
          {/*    </Typography>*/}
          {/*    <Typography*/}
          {/*        sx={{ fontSize: 16, flex: '1 1 100%' }}*/}
          {/*        component="li"*/}
          {/*    >*/}
          {/*        A demo video giving an overview of the system is also available at <Link href="http://tracker.pathfinding.ai/systemDemo"> here</Link>.*/}

          {/*    </Typography>*/}
          {/*</ul>*/}

          {/*<Typography*/}
          {/*    sx={{ fontSize: 16, flex: '1 1 100%'}}*/}
          {/*    variant="h6"*/}
          {/*    component="div"*/}
          {/*>*/}
          {/*    A full length manuscript is available at <Link href="https://arxiv.org/abs/2305.08446">arXiv</Link>. When using our website, please cite the following:*/}
          {/*</Typography>*/}
          <div className="paper-content">
            <div className="code-viewer">
              {bibtexEntry}
              <div className="copy-button-container">
                {copySuccess && (
                  <span className="copy-success-message">
                    Copied to clipboard!
                  </span>
                )}
                <Tooltip title="Click to Copy" placement="top" arrow>
                  <button className="copy-button" onClick={handleCopyClick}>
                    <FileCopyIcon />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>

          <Typography
            sx={{
              fontSize: 16,
              flex: "1 1 100%",
              paddingTop: "15px",
              paddingBottom: "25px",
            }}
            component="div"
          >
            The following video demonstration gives an overview of our system:
          </Typography>
          <iframe
            style={{
              paddingLeft: "5%",
              paddingRight: "5%",
              paddingBottom: "5%",
            }}
            width="90%"
            height="720"
            src="https://www.youtube.com/embed/qtG6-h4FZxU"
            title="Tracking Progress in MAPF - ICAPS 2023 System Demonstration"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </Box>
      </Paper>
      {/*<Paper  sx={{ width: '100%', mb: 2, }}>*/}
      {/*    <Toolbar*/}
      {/*        sx={{*/}
      {/*            pl: { sm: 2 },*/}
      {/*            pr: { xs: 1, sm: 1 }*/}
      {/*        }}*/}
      {/*    >*/}
      {/*        <Typography*/}
      {/*            sx={{ flex: '1 1 100%',paddingLeft :'10px' }}*/}
      {/*            variant="h6"*/}
      {/*            component="div"*/}
      {/*        >*/}
      {/*            System Demo*/}
      {/*        </Typography>*/}
      {/*    </Toolbar>*/}
      {/*    <Divider sx={{ borderBottomWidth: '3px' }} />*/}
      {/*    /!*<div style={{width: "100%",   display: "grid",*!/*/}
      {/*    /!*    gridTemplateColumns: "repeat(auto-fill,minmax(320px, 1fr))",*!/*/}
      {/*    /!*    paddingTop:50*!/*/}
      {/*    /!*}}>*!/*/}
      {/*        /!* <video style = {{paddingTop: "5%", paddingLeft: "5%",paddingRight: "5%",paddingBottom: "5%", }} width="90%" height="600" controls>*/}
      {/*            <source src= {import("./assets/videos/demo_video.mp4")} type="video/mp4" />*/}
      {/*            Your browser does not support the video tag.*/}
      {/*        </video> *!/*/}
      {/*        <iframe style = {{paddingTop: "5%", paddingLeft: "5%",paddingRight: "5%",paddingBottom: "5%", }} width="90%" height="720" src="https://www.youtube.com/embed/qtG6-h4FZxU" title="Tracking Progress in MAPF - ICAPS 2023 System Demonstration" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>*/}
      {/*    /!*</div>*!/*/}
      {/*</Paper>*/}
    </Stack>
  );
}
