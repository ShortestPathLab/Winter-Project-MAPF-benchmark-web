import db from "../models/index";
import { RequestHandler } from "express";
const Solution_submission = db.submissions;
import { ObjectID as ObjectId } from "mongodb";

export const findLeadingSolutionByInstance_id: RequestHandler = (req, res) => {
  const id = req.params.id;

  Solution_submission.find({ instance_id: new ObjectId(id), isleading: true })
    .then((data) => {
      if (!data)
        res
          .status(404)
          .send({ message: "Not leading solution with instance id =" + id });
      else res.send(data);
    })
    .catch((err) => {
      res
        .status(500)
        .send({ message: "Error leading solution with instance id =" + id });
    });
};

export const findLeadingSolutionByInstance_idAndAgents: RequestHandler = (
  req,
  res
) => {
  const id = req.params.id;
  const num = req.params.agents;

  Solution_submission.find({
    instance_id: new ObjectId(id),
    agents: Number(num),
  })
    .then((data) => {
      if (!data)
        res
          .status(404)
          .send({ message: "Not leading solution with instance id =" + id });
      else res.send(data);
    })
    .catch((err) => {
      res
        .status(500)
        .send({ message: "Error leading solution with instance id =" + id });
    });
};

// exports.findLeadingSolutionByPaths: RequestHandler = (req, res) => {
//     const id = req.params.id;
//     const num = req.params.agents;
//
//     Solution_submission.find({_id : ObjectId(id), agents : Number(num) })
//         .then(data => {
//             if (!data)
//                 res.status(404).send({ message: "Not leading solution with instance id =" + id });
//             else res.send(data);
//         })
//         .catch(err => {
//             res
//                 .status(500)
//                 .send({ message: "Error leading solution with instance id =" + id });
//         });
// };

// // Find a single Tutorial with an id
// exports.findByInstance_id: RequestHandler = (req, res) => {
//     const id = req.params.id;
//
//     Submission.find({instance_id : id})
//         .then(data => {
//             if (!data)
//                 res.status(404).send({ message: "Not found Map with id " + id });
//             else res.send(data);
//         })
//         .catch(err => {
//             res
//                 .status(500)
//                 .send({ message: "Error retrieving Map with id=" + id });
//         });
// };
